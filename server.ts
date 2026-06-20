import "./src/init.js";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { put as vercelBlobPut } from "@vercel/blob";

let cloudinary: any = null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Make sure the uploads folder exists
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Resilient Database initialization
  let db: any = null;
  let useFallbackDb = false;
  
  // In-memory persistent state mock store for serverless compatibility
  const memoryDbStore: Record<string, any[]> = {
    cms_state: [],
    inquiries: [],
    media_assets: []
  };

  try {
    const dbPath = path.join(process.cwd(), "kbl.db");
    console.info(`[LOCAL SQLITE] Initializing database at ${dbPath}`);
    db = new Database(dbPath);

    // Enable WAL mode for high performance concurrency handling
    db.pragma('journal_mode = WAL');

    // Create tables if they do not exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS cms_state (
        id TEXT PRIMARY KEY,
        state_data TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS inquiries (
        id TEXT PRIMARY KEY,
        event_type TEXT,
        date TEXT,
        guest_count TEXT,
        budget_range TEXT,
        message TEXT,
        full_name TEXT,
        email TEXT,
        phone TEXT,
        status TEXT,
        proposal_concept TEXT,
        submitted_at TEXT
      );

      CREATE TABLE IF NOT EXISTS media_assets (
        id TEXT PRIMARY KEY,
        title TEXT,
        category TEXT,
        video_url TEXT,
        poster_image TEXT,
        featured INTEGER,
        tags TEXT,
        event_date TEXT,
        status TEXT,
        process_stage TEXT,
        display_order INTEGER
      );
    `);
    console.info("[LOCAL SQLITE] Tables verified/created successfully.");
  } catch (err) {
    console.warn("[PRODUCTION RESILIENCE WARNING] SQLite failed to initialize. Falling back to in-memory state engine for Serverless Vercel compatibility:", err);
    useFallbackDb = true;
  }

  // Configure Cloudinary if credentials are provided
  if (process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)) {
    console.info("[MEDIA PIPELINE] Configuring Cloudinary upload credentials...");
    try {
      const cloudinaryModule = await import("cloudinary");
      cloudinary = cloudinaryModule.v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });
    } catch (err) {
      console.error("[MEDIA PIPELINE ERROR] Failed to dynamically load or initialize Cloudinary:", err);
    }
  }

  interface CloudinaryUploadResult {
    secure_url: string;
    public_id: string;
  }

  // Production-compatible Cloud Security Cloudinary Media Pipeline ONLY
  async function uploadMedia(buffer: Buffer, filename: string, contentType: string): Promise<CloudinaryUploadResult> {
    console.info(`[MEDIA PIPELINE] Activating Cloudinary-only upload flow for: ${filename}`);

    if (!cloudinary) {
      const errorMsg = "Cloudinary of v2 SDK library is not loaded/configured correctly. Check environment credentials (CLOUDINARY_URL or cloud_name/api_key/api_secret).";
      console.error(`[MEDIA PIPELINE ERROR] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    try {
      let cleanBase = path.parse(filename).name
        .replace(/[^a-zA-Z0-9_\-]/g, "_")
        .replace(/__+/g, "_")
        .replace(/^_+|_+$/g, "");
      
      if (!cleanBase) {
        cleanBase = "video";
      }

      const safePublicId = `${cleanBase}_${Date.now()}`;
      console.info(`[MEDIA PIPELINE] Initiating stream-based Cloudinary uploading for '${filename}' with safe public_id: '${safePublicId}' and folder: 'event-media'...`);
      
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "video",
            public_id: safePublicId,
            folder: "event-media"
          },
          (error: any, result: any) => {
            if (error) {
              console.error(`[MEDIA PIPELINE] Cloudinary stream upload error:`, error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        uploadStream.end(buffer);
      });

      console.info(`[MEDIA PIPELINE SUCCESS] Cloudinary response received:`, JSON.stringify(result, null, 2));
      console.info(`[MEDIA PIPELINE LOG] secure_url generated: ${result.secure_url}`);
      return {
        secure_url: result.secure_url,
        public_id: result.public_id
      };
    } catch (err: any) {
      console.error(`[MEDIA PIPELINE ERROR] Direct Cloudinary uploading failed:`, err);
      throw err;
    }
  }

  // --- API ENDPOINTS ---

  // Raw body parser for binary file uploads - supports all incoming types up to 10GB (10240mb)
  app.post(
    "/api/upload",
    express.raw({ type: "*/*", limit: "10240mb" }),
    async (req, res) => {
      try {
        const contentType = req.headers["content-type"] || "video/mp4";
        const xFileName = (req.headers["x-file-name"] as string) || "video.mp4";
        
        // Upload via Cloudinary ONLY
        const uploadResult = await uploadMedia(req.body, xFileName, contentType);
        
        console.log(`[PERSISTENCE API] CMS save confirmation: Uploaded successfully. Generated secure_url: ${uploadResult.secure_url}`);
        res.json({
          videoUrl: uploadResult.secure_url,
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id
        });
      } catch (err: any) {
        console.error("[PERSISTENCE API ERROR]:", err);
        res.status(500).json({ error: err.message || "Failed to upload video" });
      }
    }
  );

  // Chunked upload API endpoint to bypass Cloud Run / GFE 32MB payload request body limits
  app.post(
    "/api/upload-chunk",
    express.raw({ type: "application/octet-stream", limit: "250mb" }),
    async (req, res) => {
      try {
        const uploadId = req.headers["x-upload-id"] as string;
        const chunkIndexStr = req.headers["x-chunk-index"] as string;
        const chunkTotalStr = req.headers["x-chunk-total"] as string;
        const xFileName = (req.headers["x-file-name"] as string) || "video.mp4";

        if (!uploadId || chunkIndexStr === undefined || chunkTotalStr === undefined) {
          return res.status(400).json({ error: "Missing chunk upload registration headers" });
        }

        const chunkIndex = parseInt(chunkIndexStr, 10);
        const chunkTotal = parseInt(chunkTotalStr, 10);

        // Create temporary chunk subdirectory for this specific upload session
        const tempChunkDir = path.join(uploadsDir, "temp-chunks", uploadId);
        if (!fs.existsSync(tempChunkDir)) {
          fs.mkdirSync(tempChunkDir, { recursive: true });
        }

        const chunkPath = path.join(tempChunkDir, `chunk-${chunkIndex}`);
        
        // Write the chunk payload buffer securely to disk
        fs.writeFileSync(chunkPath, req.body);

        console.log(`[CHUNKED UPLOAD] Received chunk index ${chunkIndex + 1}/${chunkTotal} for transaction "${uploadId}" (${req.body.length} bytes).`);

        // Check if all chunks (0 to chunkTotal - 1) have arrived on disk
        let allUploaded = true;
        for (let i = 0; i < chunkTotal; i++) {
          const expectedFile = path.join(tempChunkDir, `chunk-${i}`);
          if (!fs.existsSync(expectedFile)) {
            allUploaded = false;
            break;
          }
        }

        // If all chunks are successfully collected on disk, assemble and upload them to the cloud pipeline
        if (allUploaded) {
          const ext = path.extname(xFileName) || ".mp4";
          const tempFilename = `temp-assembled-${Date.now()}${ext}`;
          const finalPath = path.join(uploadsDir, tempFilename);

          console.info(`[CHUNKED UPLOAD] Assembly initiated for ${chunkTotal} chunks. Staging assembled file: "${finalPath}"`);

          const writeStream = fs.createWriteStream(finalPath);
          for (let i = 0; i < chunkTotal; i++) {
            const expectedFile = path.join(tempChunkDir, `chunk-${i}`);
            const dataBuffer = fs.readFileSync(expectedFile);
            writeStream.write(dataBuffer);
          }
          writeStream.end();

          // Wait on the stream finish event
          await new Promise<void>((resolve, reject) => {
            writeStream.on("finish", () => {
              resolve();
            });
            writeStream.on("error", (err) => {
              reject(err);
            });
          });

          // Read the assembled file as a buffer
          const assembledBuffer = fs.readFileSync(finalPath);

          // Upload buffer via Cloudinary ONLY
          const uploadResult = await uploadMedia(assembledBuffer, xFileName, "video/mp4");

          // Perform garbage collection to remove temporary chunk files and assembled temp file
          try {
            fs.rmSync(tempChunkDir, { recursive: true, force: true });
            fs.unlinkSync(finalPath);
            console.info(`[CHUNKED UPLOAD] Garbage collection deleted temporary files.`);
          } catch (cleanupErr) {
            console.warn(`[CHUNKED UPLOAD WARNING] Failed to clean up temp session files:`, cleanupErr);
          }

          console.info(`[CHUNKED UPLOAD SUCCESS] Uploaded file via Cloudinary pipeline: secure_url: ${uploadResult.secure_url}`);
          return res.json({
            videoUrl: uploadResult.secure_url,
            secure_url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
            completed: true
          });
        }

        return res.json({ completed: false, receivedChunk: chunkIndex });
      } catch (err: any) {
        console.error("[CHUNKED UPLOAD ERROR]:", err);
        res.status(500).json({ error: err.message || "Failed to process chunk" });
      }
    }
  );

  // Serve CORS configuration for uploads to secure resource sharing inside browsers & iframe previews
  app.use("/uploads", (req, res, next) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Range, Content-Type");
    res.set("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Specialized media streaming with explicit byte-range headers (206 Partial Content) for Safari/Chrome compatibility
  app.get("/uploads/:filename", (req, res) => {
    const filename = req.params.filename;
    // Prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(403).send("Access denied");
    }
    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found");
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Detect exact mime type
    let contentType = "application/octet-stream";
    const normalizedPath = filename.toLowerCase();
    if (normalizedPath.endsWith(".mp4")) {
      contentType = "video/mp4";
    } else if (normalizedPath.endsWith(".webm")) {
      contentType = "video/webm";
    } else if (normalizedPath.endsWith(".mov")) {
      contentType = "video/quicktime";
    } else if (normalizedPath.endsWith(".ogv") || normalizedPath.endsWith(".ogg")) {
      contentType = "video/ogg";
    }

    // Double-verify CORS and accept-range support headers
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Type",
      "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges",
      "Accept-Ranges": "bytes"
    });

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Handle invalid or out-of-bounds ranges
      if (start >= fileSize || end >= fileSize || start > end) {
        res.status(416).set("Content-Range", `bytes */${fileSize}`).send("Requested Range Not Satisfiable");
        return;
      }

      const chunksize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });
      
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Length": chunksize,
        "Content-Type": contentType
      });

      fileStream.pipe(res);
      fileStream.on("error", (streamErr) => {
        console.error(`[STREAM ERROR] Error serving partial range content for ${filename}:`, streamErr);
        if (!res.headersSent) {
          res.sendStatus(500);
        }
      });
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": contentType
      });
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      fileStream.on("error", (streamErr) => {
        console.error(`[STREAM ERROR] Error serving full content stream for ${filename}:`, streamErr);
        if (!res.headersSent) {
          res.sendStatus(500);
        }
      });
    }
  });

  // Serve static files as a fallback
  app.use(
    "/uploads",
    express.static(uploadsDir, {
      setHeaders: (res, filePath, stat) => {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
        res.set("Access-Control-Allow-Headers", "Range, Content-Type");
        res.set("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
        res.set("Accept-Ranges", "bytes");

        const normalizedPath = filePath.toLowerCase();
        if (normalizedPath.endsWith(".mp4")) {
          res.set("Content-Type", "video/mp4");
        } else if (normalizedPath.endsWith(".webm")) {
          res.set("Content-Type", "video/webm");
        } else if (normalizedPath.endsWith(".mov")) {
          res.set("Content-Type", "video/quicktime");
        } else if (normalizedPath.endsWith(".ogv") || normalizedPath.endsWith(".ogg")) {
          res.set("Content-Type", "video/ogg");
        }
      }
    })
  );

  // --- API ROUTING COMPATIBILITY FOR SQLite AND IN-MEMORY FALLBACK ---

  // 1. GET CMS State By ID ('draft' | 'published')
  app.get("/api/cms-state/:id", (req, res) => {
    try {
      const { id } = req.params;
      if (useFallbackDb) {
        const item = memoryDbStore.cms_state.find(x => x.id === id);
        return res.json({ data: item ? JSON.parse(item.state_data) : null });
      }

      const row = db.prepare("SELECT state_data FROM cms_state WHERE id = ?").get(id) as any;
      if (row && row.state_data) {
        return res.json({ data: JSON.parse(row.state_data) });
      }
      return res.json({ data: null });
    } catch (err: any) {
      console.error("[LOCAL SQLite CMS GET ERROR]:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 2. POST CMS State By ID ('draft' | 'published')
  app.post("/api/cms-state/:id", express.json({ limit: "250mb" }), (req, res) => {
    try {
      const { id } = req.params;
      const { state } = req.body;
      if (!state) {
        return res.status(400).json({ error: "Missing state payload" });
      }

      if (useFallbackDb) {
        const index = memoryDbStore.cms_state.findIndex(x => x.id === id);
        const payload = { id, state_data: JSON.stringify(state), updated_at: new Date().toISOString() };
        if (index > -1) {
          memoryDbStore.cms_state[index] = payload;
        } else {
          memoryDbStore.cms_state.push(payload);
        }
        console.log(`[IN-MEMORY CMS SAVE SUCCESS]: State "${id}" synchronized.`);
        return res.json({ success: true });
      }

      const stmt = db.prepare(`
        INSERT INTO cms_state (id, state_data, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET state_data = excluded.state_data, updated_at = excluded.updated_at
      `);
      stmt.run(id, JSON.stringify(state), new Date().toISOString());

      console.log(`[LOCAL SQLite CMS SAVE SUCCESS]: State "${id}" synchronized completely.`);
      res.json({ success: true });
    } catch (err: any) {
      console.error("[LOCAL SQLite CMS POST ERROR]:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 3. GET Inquiries
  app.get("/api/inquiries", (req, res) => {
    try {
      if (useFallbackDb) {
        const sorted = [...memoryDbStore.inquiries].sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
        return res.json({ data: sorted });
      }

      const rows = db.prepare("SELECT * FROM inquiries ORDER BY submitted_at DESC").all() as any[];
      const mapRows = rows.map(r => ({
        id: r.id,
        eventType: r.event_type,
        date: r.date,
        guestCount: r.guest_count,
        budgetRange: r.budget_range,
        message: r.message,
        fullName: r.full_name,
        email: r.email,
        phone: r.phone,
        status: r.status,
        proposalConcept: r.proposal_concept ? JSON.parse(r.proposal_concept) : null,
        submittedAt: r.submitted_at
      }));
      res.json({ data: mapRows });
    } catch (err: any) {
      console.error("[LOCAL SQLite GET INQUIRIES ERROR]:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 4. POST (Upsert) Inquiry
  app.post("/api/inquiries", express.json({ limit: "2mb" }), (req, res) => {
    try {
      const inquiry = req.body;
      if (!inquiry || !inquiry.id) {
        return res.status(400).json({ error: "Missing inquiry or ID payload" });
      }

      if (useFallbackDb) {
        const index = memoryDbStore.inquiries.findIndex(x => x.id === inquiry.id);
        const mapped = {
          id: inquiry.id,
          event_type: inquiry.eventType || null,
          date: inquiry.date || null,
          guest_count: inquiry.guestCount || null,
          budget_range: inquiry.budgetRange || null,
          message: inquiry.message || null,
          full_name: inquiry.fullName || null,
          email: inquiry.email || null,
          phone: inquiry.phone || null,
          status: inquiry.status || "New",
          proposal_concept: inquiry.proposalConcept || null,
          submitted_at: inquiry.submittedAt || new Date().toISOString()
        };
        if (index > -1) {
          memoryDbStore.inquiries[index] = mapped;
        } else {
          memoryDbStore.inquiries.push(mapped);
        }
        console.log(`[IN-MEMORY INQUIRY SAVE SUCCESS]: Saved: ${inquiry.id}`);
        return res.json({ success: true });
      }

      const stmt = db.prepare(`
        INSERT INTO inquiries (id, event_type, date, guest_count, budget_range, message, full_name, email, phone, status, proposal_concept, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET 
          event_type = excluded.event_type,
          date = excluded.date,
          guest_count = excluded.guest_count,
          budget_range = excluded.budget_range,
          message = excluded.message,
          full_name = excluded.full_name,
          email = excluded.email,
          phone = excluded.phone,
          status = excluded.status,
          proposal_concept = excluded.proposal_concept,
          submitted_at = excluded.submitted_at
      `);
      stmt.run(
        inquiry.id,
        inquiry.eventType || null,
        inquiry.date || null,
        inquiry.guestCount || null,
        inquiry.budgetRange || null,
        inquiry.message || null,
        inquiry.fullName || null,
        inquiry.email || null,
        inquiry.phone || null,
        inquiry.status || "New",
        inquiry.proposalConcept ? JSON.stringify(inquiry.proposalConcept) : null,
        inquiry.submittedAt || new Date().toISOString()
      );

      console.log(`[LOCAL SQLite INQUIRY SAVE SUCCESS]: Saved: ${inquiry.id}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error("[LOCAL SQLite SAVE INQUIRY ERROR]:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 5. GET Media Assets
  app.get("/api/media-assets", (req, res) => {
    try {
      if (useFallbackDb) {
        const sorted = [...memoryDbStore.media_assets].sort((a,b) => a.display_order - b.display_order);
        const mapped = sorted.map(r => ({
          id: r.id,
          title: r.title,
          category: r.category,
          videoUrl: r.video_url,
          posterImage: r.poster_image,
          featured: Boolean(r.featured),
          tags: JSON.parse(r.tags || "[]"),
          eventDate: r.event_date,
          status: r.status,
          processStage: r.process_stage,
          displayOrder: r.display_order
        }));
        return res.json({ data: mapped });
      }

      const rows = db.prepare("SELECT * FROM media_assets ORDER BY display_order ASC").all() as any[];
      const mapRows = rows.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category,
        videoUrl: r.video_url,
        posterImage: r.poster_image,
        featured: Boolean(r.featured),
        tags: JSON.parse(r.tags || "[]"),
        eventDate: r.event_date,
        status: r.status,
        processStage: r.process_stage,
        displayOrder: r.display_order
      }));
      res.json({ data: mapRows });
    } catch (err: any) {
      console.error("[LOCAL SQLite GET MEDIA ERROR]:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 6. POST (Upsert) Media Asset
  app.post("/api/media-assets", express.json({ limit: "5mb" }), (req, res) => {
    try {
      const asset = req.body;
      if (!asset || !asset.id) {
        return res.status(400).json({ error: "Missing asset or ID payload" });
      }

      if (useFallbackDb) {
        const index = memoryDbStore.media_assets.findIndex(x => x.id === asset.id);
        const mapped = {
          id: asset.id,
          title: asset.title || null,
          category: asset.category || null,
          video_url: asset.videoUrl || null,
          poster_image: asset.posterImage || null,
          featured: asset.featured ? 1 : 0,
          tags: JSON.stringify(asset.tags || []),
          event_date: asset.eventDate || null,
          status: asset.status || "Active",
          process_stage: asset.processStage || null,
          display_order: asset.displayOrder || 0
        };
        if (index > -1) {
          memoryDbStore.media_assets[index] = mapped;
        } else {
          memoryDbStore.media_assets.push(mapped);
        }
        console.log(`[IN-MEMORY MEDIA SAVE SUCCESS]: Saved asset: ${asset.id}`);
        return res.json({ success: true });
      }

      const stmt = db.prepare(`
        INSERT INTO media_assets (id, title, category, video_url, poster_image, featured, tags, event_date, status, process_stage, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          category = excluded.category,
          video_url = excluded.video_url,
          poster_image = excluded.poster_image,
          featured = excluded.featured,
          tags = excluded.tags,
          event_date = excluded.event_date,
          status = excluded.status,
          process_stage = excluded.process_stage,
          display_order = excluded.display_order
      `);
      stmt.run(
        asset.id,
        asset.title || null,
        asset.category || null,
        asset.videoUrl || null,
        asset.posterImage || null,
        asset.featured ? 1 : 0,
        JSON.stringify(asset.tags || []),
        asset.eventDate || null,
        asset.status || "Active",
        asset.processStage || null,
        asset.displayOrder || 0
      );

      console.log(`[LOCAL SQLite MEDIA SAVE SUCCESS]: Saved asset: ${asset.id}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error("[LOCAL SQLite SAVE MEDIA ERROR]:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 7. DELETE Media Asset
  app.delete("/api/media-assets/:id", (req, res) => {
    try {
      const { id } = req.params;
      
      if (useFallbackDb) {
        const index = memoryDbStore.media_assets.findIndex(x => x.id === id);
        if (index > -1) {
          memoryDbStore.media_assets.splice(index, 1);
        }
        console.log(`[IN-MEMORY MEDIA DELETE SUCCESS]: Removed asset: ${id}`);
        return res.json({ success: true });
      }

      const stmt = db.prepare("DELETE FROM media_assets WHERE id = ?");
      stmt.run(id);

      console.log(`[LOCAL SQLite MEDIA DELETE SUCCESS]: Removed asset: ${id}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error("[LOCAL SQLite DELETE MEDIA ERROR]:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 8. PRODUCTION AUDITOR: Verify all stored and default video URLs and status codes
  app.get("/api/audit-media", async (req, res) => {
    try {
      let assets: any[] = [];
      if (useFallbackDb) {
        assets = memoryDbStore.media_assets.map(r => ({
          id: r.id,
          title: r.title,
          videoUrl: r.video_url
        }));
      } else {
        const rows = db.prepare("SELECT id, title, video_url FROM media_assets").all() as any[];
        assets = rows.map(r => ({
          id: r.id,
          title: r.title,
          videoUrl: r.video_url
        }));
      }

      // Include default website portfolio assets to verify out-of-the-box system safety
      const defaultUrls = [
        { id: 'media-val-1', title: 'The Sovereign Wedding Gala', videoUrl: 'https://res.cloudinary.com/demo/video/upload/dog.mp4' },
        { id: 'media-val-2', title: 'Precision Corporate Summit', videoUrl: 'https://res.cloudinary.com/demo/video/upload/elephants.mp4' },
        { id: 'media-val-3', title: 'Bespoke Milestone Anniversary', videoUrl: 'https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4' },
        { id: 'media-val-4', title: 'Grand Charity Gala Dinner', videoUrl: 'https://res.cloudinary.com/demo/video/upload/v1537134375/docs/hotel_booking.mp4' },
        { id: 'media-val-5', title: 'Exclusive Brand Showcase', videoUrl: 'https://res.cloudinary.com/demo/video/upload/c_scale,w_640/dog.mp4' }
      ];

      const allToVerify = [...assets];
      defaultUrls.forEach(def => {
        if (!allToVerify.some(a => a.videoUrl === def.videoUrl)) {
          allToVerify.push(def);
        }
      });

      const auditResults = await Promise.all(
        allToVerify.map(async (asset) => {
          let status = 0;
          let ok = false;
          let errorMessage = "";
          const url = asset.videoUrl || "";

          if (url.startsWith('/uploads/')) {
            const filePath = path.join(process.cwd(), url);
            if (fs.existsSync(filePath)) {
              status = 200;
              ok = true;
            } else {
              status = 404;
              ok = false;
              errorMessage = "File missing from uploads storage disk";
            }
          } else if (url.startsWith('http://') || url.startsWith('https://')) {
            try {
              // Perform lightweight HEAD request for high performance
              const fetchRes = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
              status = fetchRes.status;
              ok = fetchRes.ok;
            } catch (err: any) {
              errorMessage = err.message || "HEAD request failed";
              try {
                // Retry with standard GET
                const fetchRes = await fetch(url, { signal: AbortSignal.timeout(5000) });
                status = fetchRes.status;
                ok = fetchRes.ok;
              } catch (retryErr: any) {
                status = 0;
                ok = false;
                errorMessage = retryErr.message || "HEAD & GET connection timeouts";
              }
            }
          } else if (url.startsWith('local-video://') || url.startsWith('blob:')) {
            status = 200;
            ok = true;
            errorMessage = "Dynamic Client-side Offline Sandbox Reference";
          } else {
            status = 400;
            ok = false;
            errorMessage = "Unsupported or invalid media link identifier";
          }

          return {
            id: asset.id,
            title: asset.title,
            videoUrl: url,
            status,
            ok,
            error: errorMessage || null
          };
        })
      );

      res.json({
        dbType: useFallbackDb ? "In-Memory Resilience Mode" : "Native SQLite Mode",
        cloudStorageConnected: Boolean(process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)),
        auditResults
      });
    } catch (err: any) {
      console.error("[AUDIT API GENERAL ERROR]:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
