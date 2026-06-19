import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Make sure the uploads folder exists
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Initialize SQLite kbl.db Database
  const dbPath = path.join(process.cwd(), "kbl.db");
  console.info(`[LOCAL SQLITE] Initializing database at ${dbPath}`);
  const db = new Database(dbPath);

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
      guest_count INTEGER,
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

  // Raw body parser for binary file uploads - supports all incoming types up to 10GB (10240mb)
  app.post(
    "/api/upload",
    express.raw({ type: "*/*", limit: "10240mb" }),
    (req, res) => {
      try {
        const contentType = req.headers["content-type"] || "video/mp4";
        const xFileName = (req.headers["x-file-name"] as string) || "video.mp4";
        const ext = path.extname(xFileName) || ".mp4";
        const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}${ext}`;
        const filePath = path.join(uploadsDir, filename);

        // Save raw video payload buffer to static assets directory
        fs.writeFileSync(filePath, req.body);

        // Construct absolute-relative URL for flexible deployment environment routing
        const videoUrl = `/uploads/${filename}`;

        console.log(`[PERSISTENCE API] Success. Saved to: ${filePath}. Host URL: ${videoUrl}, size: ${req.body.length || 0} bytes`);
        res.json({ videoUrl });
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

        // If all chunks are successfully collected on disk, assemble them into the final file path
        if (allUploaded) {
          const ext = path.extname(xFileName) || ".mp4";
          const finalFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}${ext}`;
          const finalPath = path.join(uploadsDir, finalFilename);

          console.info(`[CHUNKED UPLOAD] Assembly initiated for ${chunkTotal} chunks. Staging final video file: "${finalPath}"`);

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

          // Perform garbage collection to remove temporary chunk files
          try {
            fs.rmSync(tempChunkDir, { recursive: true, force: true });
            console.info(`[CHUNKED UPLOAD] Garbage collection deleted session workspace: "${tempChunkDir}"`);
          } catch (cleanupErr) {
            console.warn(`[CHUNKED UPLOAD WARNING] Failed to clean up temp session chunks:`, cleanupErr);
          }

          // Build permanent file URL mapping with absolute-relative path
          const videoUrl = `/uploads/${finalFilename}`;

          console.info(`[CHUNKED UPLOAD SUCCESS] Saved final size: ${fs.statSync(finalPath).size} bytes. Direct URL: ${videoUrl}`);
          return res.json({ videoUrl, completed: true });
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

  // --- LOCAL SQLite API ENDPOINTS ---

  // 1. GET CMS State By ID ('draft' | 'published')
  app.get("/api/cms-state/:id", (req, res) => {
    try {
      const { id } = req.params;
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
        proposalConcept: r.proposal_concept,
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
        inquiry.proposalConcept || null,
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
      const stmt = db.prepare("DELETE FROM media_assets WHERE id = ?");
      stmt.run(id);

      console.log(`[LOCAL SQLite MEDIA DELETE SUCCESS]: Removed asset: ${id}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error("[LOCAL SQLite DELETE MEDIA ERROR]:", err);
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
