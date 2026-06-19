import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Layout, Sparkles, Compass, Cpu, Palette, Users, ClipboardList, 
  Settings, Image, Eye, UploadCloud, Film, Lock, Shield, UserCheck, 
  HelpCircle, Trash2, Plus, ArrowUp, ArrowDown, Edit3, Save, CheckCircle2, 
  RefreshCw, FileText, Search, Folder, Globe, AlignJustify, Hash, Check,
  Database
} from 'lucide-react';
import { useCMS, CMSRole, CMSMode, TeamMember, MediaAsset, NavigationItem, ThemeConfig, SEOConfig, HeroConfig } from '../lib/cmsState';
import { saveVideoToIndexedDB } from '../lib/videoDb';
import { EventType, ServiceDetail, CaseStudy, ClientStory, Inquiry } from '../types';
import { isSupabaseConfigured, testSupabaseConnection } from '../lib/supabaseClient';

export default function AdminCMS() {
  const { 
    draftState: state, publishedState, setCmsMode, cmsMode, currentRole, setCurrentRole,
    isCmsOpen, setIsCmsOpen, publishDraft, resetToDefaults,
    updateHeroConfig, updateHeroText, updateCategory, addCategory, deleteCategory, reorderCategories,
    addService, updateService, deleteService, reorderServices,
    addProject, updateProject, deleteProject, reorderProjects,
    addMediaAsset, updateMediaAsset, deleteMediaAsset,
    addTestimonial, updateTestimonial, deleteTestimonial,
    addTeamMember, updateTeamMember, deleteTeamMember,
    updateInquiryStatus, saveInquiryProposal,
    updateNavigationItem, reorderNavigationItems,
    updateTheme, updateSEO,
    addProcessStep, updateProcessStep, deleteProcessStep, reorderProcessSteps,
    resolveVideoUrl, uploadVideo
  } = useCMS();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'database' | 'hero' | 'services' | 'process' | 'portfolio' | 'gallery' | 'testimonials' | 'team' | 'crm' | 'navigation' | 'seo' | 'media'>('dashboard');

  // Supabase Integration local diagnostic states
  const [dbTestStatus, setDbTestStatus] = useState<'idle' | 'checking' | 'success' | 'failed'>('idle');
  const [dbTestMessage, setDbTestMessage] = useState('');
  const [dbTestCode, setDbTestCode] = useState<string | undefined>(undefined);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'failed'>('idle');
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  // Interactive local states for forms
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTestimonialIdx, setEditingTestimonialIdx] = useState<number | null>(null);
  const [editingProcessIdx, setEditingProcessIdx] = useState<number | null>(null);

  // Search parameters
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaActiveFolder, setMediaActiveFolder] = useState<string>('All');
  const [crmSearch, setCrmSearch] = useState('');
  const [crmStatusFilter, setCrmStatusFilter] = useState<string>('All');

  // New assets additions local parameters
  const [newMediaName, setNewMediaName] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [tempPreviewUrl, setTempPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [newMediaDescription, setNewMediaDescription] = useState('');
  const [newMediaCategory, setNewMediaCategory] = useState('');
  const [newMediaFeatured, setNewMediaFeatured] = useState(false);
  const [newMediaBadge, setNewMediaBadge] = useState('');
  const [newMediaDate, setNewMediaDate] = useState('');
  const [newMediaDisplayOrder, setNewMediaDisplayOrder] = useState<number>(0);
  const [newMediaPosterImage, setNewMediaPosterImage] = useState('');
  const [newMediaStatus, setNewMediaStatus] = useState<'Active' | 'Hidden'>('Active');
  const [newMediaProcessStage, setNewMediaProcessStage] = useState<'' | 'Vision' | 'Blueprint' | 'Build' | 'Moment' | 'Legacy'>('');

  // Media Editing states
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [editingMediaTitle, setEditingMediaTitle] = useState('');
  const [editingMediaVideoUrl, setEditingMediaVideoUrl] = useState('');
  const [editingMediaDescription, setEditingMediaDescription] = useState('');
  const [editingMediaCategory, setEditingMediaCategory] = useState('');
  const [editingMediaFeatured, setEditingMediaFeatured] = useState(false);
  const [editingMediaBadge, setEditingMediaBadge] = useState('');
  const [editingMediaDate, setEditingMediaDate] = useState('');
  const [editingMediaDisplayOrder, setEditingMediaDisplayOrder] = useState<number>(0);
  const [editingMediaPosterImage, setEditingMediaPosterImage] = useState('');
  const [editingMediaStatus, setEditingMediaStatus] = useState<'Active' | 'Hidden'>('Active');
  const [editingMediaProcessStage, setEditingMediaProcessStage] = useState<'' | 'Vision' | 'Blueprint' | 'Build' | 'Moment' | 'Legacy'>('');

  // Categories Panel states
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [catFormId, setCatFormId] = useState('');
  const [catFormTitle, setCatFormTitle] = useState('');
  const [catFormSubtext, setCatFormSubtext] = useState('');
  const [catFormDescription, setCatFormDescription] = useState('');
  const [catFormCoverVideo, setCatFormCoverVideo] = useState('');
  const [catFormCoverImage, setCatFormCoverImage] = useState('');
  const [catFormVisible, setCatFormVisible] = useState(true);
  const [catFormOrder, setCatFormOrder] = useState<number>(0);
  const [catFormBadge, setCatFormBadge] = useState('');

  // Custom non-blocking elegante browser alert & confirm override dialogs
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm' | 'prompt';
    message: string;
    defaultValue?: string;
    promptValue?: string;
    onConfirm?: (value?: string) => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    type: 'alert',
    message: ''
  });

  const triggerAlert = (message: string, callback?: () => void) => {
    setDialogState({
      isOpen: true,
      type: 'alert',
      message,
      onConfirm: () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
        if (callback) callback();
      }
    });
  };

  const triggerConfirm = (message: string, onConfirm: () => void, onCancel?: () => void) => {
    setDialogState({
      isOpen: true,
      type: 'confirm',
      message,
      onConfirm: () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
        if (onCancel) onCancel();
      }
    });
  };

  const triggerPrompt = (message: string, defaultValue: string, onConfirm: (val: string) => void) => {
    setDialogState({
      isOpen: true,
      type: 'prompt',
      message,
      defaultValue,
      promptValue: defaultValue,
      onConfirm: (val) => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
        onConfirm(val || '');
      },
      onCancel: () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Core authorization guard based on rules
  const rolePermissions: Record<CMSRole, string[]> = {
    'super-admin': ['all'],
    'admin': ['all'],
    'content-manager': ['hero', 'services', 'process', 'portfolio', 'testimonials', 'team', 'crm', 'navigation', 'seo', 'media', 'dashboard', 'database'],
    'media-manager': ['hero', 'gallery', 'media', 'dashboard', 'database']
  };

  const hasAccess = (tab: typeof activeTab) => {
    const list = rolePermissions[currentRole];
    if (list.includes('all')) return true;
    return list.includes(tab);
  };

  if (!isCmsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0d0a08] select-none text-neutral-200 flex flex-col h-screen font-sans">
      
      {/* GLAMOROUS DOCKED CMS HEADER CONTROL RIBBON */}
      <header className="px-6 py-4 bg-[#14110f]/95 border-b border-white/5 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
        
        {/* Title branding */}
        <div className="flex items-center space-x-3 text-left">
          <div className="p-2.5 bg-brand-gold/15 border border-brand-gold/40 rounded-2xl text-brand-gold animate-pulse">
            <Cpu className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-[0.25em] text-[#d16126] uppercase block font-bold">
              GATHER ATELIER COGNITIVE CMS
            </span>
            <h1 className="text-sm font-serif font-semibold text-white tracking-wide">
              Creative Control & Spatial Narrative Engine
            </h1>
          </div>
        </div>

        {/* Real-time Draft -> Preview Mode Toggles */}
        <div className="flex items-center bg-[#0d0a08] border border-white/10 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setCmsMode('draft')}
            className={`px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5 cursor-pointer transition-colors ${
              cmsMode === 'draft' ? 'bg-[#d16126] text-white font-bold shadow-[0_2px_12px_rgba(209,97,38,0.25)]' : 'text-neutral-500 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Draft Preview
          </button>
          
          <button
            onClick={() => setCmsMode('publish')}
            className={`px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5 cursor-pointer transition-colors ${
              cmsMode === 'publish' ? 'bg-[#d16126] text-white font-bold shadow-[0_2px_12px_rgba(209,97,38,0.25)]' : 'text-neutral-500 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Live Production
          </button>
        </div>

        {/* Global Action controls */}
        <div className="flex items-center space-x-3">
          {/* Super Power Role Switching selector */}
          <div className="bg-[#0d0a08] border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#d16126]" />
            <select
              value={currentRole}
              onChange={(e) => {
                setCurrentRole(e.target.value as CMSRole);
                triggerAlert(`Role updated to ${e.target.value}. Operational interface re-authorized dynamically.`);
              }}
              className="bg-transparent text-[10px] font-mono text-neutral-300 focus:outline-none border-none py-1 cursor-pointer pr-1"
            >
              <option value="super-admin" className="bg-[#14110f] text-white">Super Admin (Root)</option>
              <option value="admin" className="bg-[#14110f] text-white">Administrator</option>
              <option value="content-manager" className="bg-[#14110f] text-white">Content Architect</option>
              <option value="media-manager" className="bg-[#14110f] text-white">Media Archivist</option>
            </select>
          </div>

          <button
            onClick={() => {
              publishDraft();
              triggerAlert('Creative draft published to production with full aesthetic compliance!');
            }}
            className="px-5 py-2.5 bg-[#d16126] text-white hover:bg-[#b04a18] text-[10px] font-mono uppercase tracking-[0.2em] font-medium rounded-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shadow-[0_4px_16px_rgba(209,97,38,0.25)]"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-white" /> Publish Live
          </button>

          <button
            onClick={() => {
              triggerConfirm(
                'Are you sure you want to restore original default settings across all sensory assets? This is irreversible.',
                () => { resetToDefaults(); }
              );
            }}
            className="p-2.5 bg-[#d16126]/5 border border-[#d16126]/20 text-[#d16126] hover:bg-[#d16126]/12 rounded-xl transition-colors cursor-pointer"
            title="Reset system database to genesis default"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsCmsOpen(false)}
            className="p-2.5 hover:bg-white/5 hover:text-white text-neutral-400 rounded-xl transition-all border border-white/10 cursor-pointer ml-1"
            aria-label="Close CMS Workspace"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* DETAILED MASTER WORKSPACE (SPLIT SCREEN VIEWPORT FOR REALTIME CHANGES) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT WORKSPACE PANEL: ACCELERATED SIDEBAR NAVIGATION */}
        <aside className="w-64 bg-[#14110f] border-r border-white/5 flex flex-col justify-between overflow-y-auto">
          <div className="py-6 px-4 space-y-6">
            <span className="text-[9px] font-mono uppercase text-[#d16126] tracking-[0.3em] font-bold block px-2.5">
              CREATIVE WORKSPACE
            </span>

            <nav className="space-y-1">
              {[
                { id: 'dashboard', label: 'Studio Dashboard', icon: Layout },
                { id: 'hero', label: 'Hero Experience', icon: Sparkles },
                { id: 'services', label: 'Service Atelier', icon: Cpu },
                { id: 'process', label: 'Sensory Steps', icon: Settings },
                { id: 'portfolio', label: 'Portfolio Studio', icon: Compass },
                { id: 'gallery', label: 'Gallery Curation', icon: FileText },
                { id: 'testimonials', label: 'Client Voices', icon: Users },
                { id: 'team', label: 'Team Members', icon: UserCheck },
                { id: 'crm', label: 'Inquiries CRM', icon: ClipboardList },
                { id: 'database', label: 'Cloud Database', icon: Database },
                { id: 'navigation', label: 'Navigation Manager', icon: AlignJustify },
                { id: 'seo', label: 'SEO Config', icon: Globe },
                { id: 'media', label: 'Media Library', icon: Image }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                const permitted = hasAccess(tab.id as typeof activeTab);
                
                return (
                  <button
                    key={tab.id}
                    disabled={!permitted}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`w-full py-2.5 px-3.5 rounded-xl text-left text-xs font-serif tracking-wide transition-all flex items-center justify-between cursor-pointer ${
                      active 
                        ? 'bg-[#d16126]/20 border border-[#d16126]/40 text-white font-bold' 
                        : !permitted
                        ? 'opacity-30 cursor-not-allowed text-[#403028]'
                        : 'text-neutral-400 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${active ? 'text-[#d16126]' : 'text-neutral-500'}`} />
                      <span>{tab.label}</span>
                    </span>
                    {!permitted && <Lock className="w-3 h-3 text-neutral-600" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Role Status and permissions panel in sidebar footer */}
          <div className="p-4 bg-[#1c1815] border-t border-white/5 space-y-1.5 text-left">
            <div className="flex items-center space-x-1.5 text-[10px] font-mono text-neutral-400">
              <Shield className="w-3 h-3 text-[#d16126]" />
              <span className="uppercase text-neutral-300 font-bold">{currentRole.replace('-', ' ')}</span>
            </div>
            <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-tight leading-relaxed">
              Authorized modules authenticated in client cache storage registry.
            </p>
          </div>
        </aside>

        {/* MIDDLE CONTENT CONTROL CENTER: CENTRAL EDITING BOARDS */}
        <main className="flex-1 bg-[#0d0a08] overflow-y-auto p-6 sm:p-8 border-r border-white/5 flex flex-col justify-between text-left">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              
              {/* TAB 1: STUDIO DASHBOARD OVERVIEW */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-4xl font-serif text-white tracking-wide">Gather Creative Command Center</h2>
                    <p className="text-neutral-400 text-xs mt-1.5">Statistical trajectory and sensory website publishing logs updated real-time.</p>
                  </div>

                  {/* Core metric modules and counters */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#14110f] border border-white/5 rounded-3xl p-5 text-left space-y-1 shadow-md">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block tracking-wider">Unprocessed Inquiries</span>
                      <p className="text-3xl font-serif text-white">{state.inquiries.length}</p>
                      <span className="text-[9px] font-mono text-emerald-400 block font-light">● Real-time Cache Active</span>
                    </div>

                    <div className="bg-[#14110f] border border-white/5 rounded-3xl p-5 text-left space-y-1 shadow-md">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block tracking-wider">Services Drafted</span>
                      <p className="text-3xl font-serif text-white">{state.services.length}</p>
                      <span className="text-[9px] font-mono text-neutral-400 block font-light">Custom milestones</span>
                    </div>

                    <div className="bg-[#14110f] border border-white/5 rounded-3xl p-5 text-left space-y-1 shadow-md">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block tracking-wider">Portfolio Chronicles</span>
                      <p className="text-3xl font-serif text-[#d16126]">{state.portfolioProjects.length}</p>
                      <span className="text-[9px] font-mono text-neutral-400 block font-light">Draping stories</span>
                    </div>

                    <div className="bg-[#14110f] border border-white/5 rounded-3xl p-5 text-left space-y-1 shadow-md">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block tracking-wider">Draft Changes Pending</span>
                      <p className="text-3xl font-serif text-blue-400">
                        {JSON.stringify(state) === JSON.stringify(publishedState) ? '0' : 'Modified'}
                      </p>
                      <span className="text-[9px] font-mono text-blue-300 block font-light">Needs sync package</span>
                    </div>
                  </div>

                  {/* Aesthetic Traffic Analysis simulations */}
                  <div className="border border-white/5 bg-[#14110f]/80 p-6 rounded-3xl space-y-4">
                    <div>
                      <h4 className="text-sm font-serif text-white tracking-wide flex items-center gap-2">
                        <ArrowUp className="w-4 h-4 text-emerald-500" /> Web Visitor Conversion Trajectory (Analytical Drift)
                      </h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">Mock analytics logs mapped weekly based on event registration inquiries.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-2">
                      <div className="space-y-1 border-l border-[#d16126]/30 pl-4 py-1">
                        <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block">Event Proposals Formulated</span>
                        <p className="text-xl font-serif text-white">42 Concepts</p>
                        <p className="text-[8px] font-mono text-neutral-500">Intelligent engine conversion: 89%</p>
                      </div>
                      <div className="space-y-1 border-l border-[#d16126]/30 pl-4 py-1">
                        <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block">Average Milestone Budget Threshold</span>
                        <p className="text-xl font-serif text-white">$92,500.00</p>
                        <p className="text-[8px] font-mono text-neutral-500">Premium Heritage tiers leading</p>
                      </div>
                      <div className="space-y-1 border-l border-[#d16126]/30 pl-4 py-1">
                        <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block">Vimeo Stream Interactions</span>
                        <p className="text-xl font-serif text-white">1,820 Plays</p>
                        <p className="text-[8px] font-mono text-neutral-500">Engagement average: 18.2s duration</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick-action wizard shortcuts */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-mono uppercase text-[#d16126] tracking-widest font-bold">Recommended Studio Tasks</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button 
                        onClick={() => setActiveTab('portfolio')} 
                        className="p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-[#d16126]/30 rounded-2xl text-left transition-all space-y-1 cursor-pointer"
                      >
                        <h4 className="text-xs font-semibold text-white">Assemble a New Event Story</h4>
                        <p className="text-[11px] text-neutral-400 font-light leading-relaxed">Publish new case studies including client names, locations, and high-res Vimeo loops.</p>
                      </button>
                      
                      <button 
                        onClick={() => setActiveTab('crm')} 
                        className="p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-[#d16126]/30 rounded-2xl text-left transition-all space-y-1 cursor-pointer"
                      >
                        <h4 className="text-xs font-semibold text-white">Audit Inbound Client Inquiries</h4>
                        <p className="text-[11px] text-neutral-400 font-light leading-relaxed">Transition visitor statuses from New &rarr; Contacted &rarr; Proposal Sent.</p>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: HERO MANAGEMENT */}
              {activeTab === 'hero' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-4xl font-serif text-white tracking-wide">Cinematic Hero Canvas Settings</h2>
                    <p className="text-neutral-400 text-xs mt-1.5">Configure spatial drift interactions, key displays, and taglines across the slider carousel.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#14110f] p-6 rounded-3xl border border-white/5 text-left">
                    <div className="space-y-4">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-[#d16126]">Primary Hero Overlays</h4>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-neutral-400 block tracking-widest">Main Headline Line 1</label>
                        <input
                          type="text"
                          value={state.heroConfig.line1}
                          onChange={(e) => updateHeroConfig({ line1: e.target.value })}
                          className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#d16126]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-neutral-400 block tracking-widest">Headline Line 2</label>
                        <input
                          type="text"
                          value={state.heroConfig.line2}
                          onChange={(e) => updateHeroConfig({ line2: e.target.value })}
                          className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#d16126]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-neutral-400 block tracking-widest">Hero Tagline Extra Narrative</label>
                        <textarea
                          rows={2}
                          value={state.heroConfig.extra}
                          onChange={(e) => updateHeroConfig({ extra: e.target.value })}
                          className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#d16126] resize-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-[#d16126]">Interaction Aesthetics</h4>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-neutral-400 block tracking-widest">Interaction Drift Behavior</label>
                        <select
                          value={state.heroConfig.hoverType}
                          onChange={(e) => updateHeroConfig({ hoverType: e.target.value as any })}
                          className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#d16126]"
                        >
                          <option value="parallax">Subtle Lens Parallax (Mouse coordinates shift visual canvas)</option>
                          <option value="lens-zoom">Aperture Dynamic Scaling On Hover Zone</option>
                          <option value="kinetic-drift">Continuous Auto-Pilot Panoramic sweep</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-neutral-400 block tracking-widest">Aesthetic Watermark Label</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="EXPERIENCE CANVAS"
                            value={state.heroConfig.headline}
                            onChange={(e) => updateHeroConfig({ headline: e.target.value })}
                            className="bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="EST. 2023"
                            value={state.heroConfig.subheadline}
                            onChange={(e) => updateHeroConfig({ subheadline: e.target.value })}
                            className="bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category-specific Slider Overwrite Cards */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-mono uppercase text-[#d16126] tracking-widest font-bold">Category Imagery & Cinematic Overwritings</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {state.eventCategories.map((cat) => {
                        const poems = state.heroTexts[cat.id] || { line1: '', line2: '', extra: '' };
                        return (
                          <div key={cat.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-wrap gap-4 items-start text-left">
                            <div className="w-16 h-20 bg-neutral-950 flex flex-col items-center justify-center rounded-xl border border-white/5 flex-shrink-0 text-center p-1">
                              <Sparkles className="w-4 h-4 text-[#d16126]/60 mb-1" />
                              <span className="text-white font-mono text-[8px] uppercase font-bold">Active</span>
                            </div>
                            
                            <div className="flex-1 space-y-2 min-w-[280px]">
                              <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
                                <span className="text-xs uppercase font-serif font-bold text-white tracking-widest">{cat.title} Slider</span>
                                <span className="text-[8px] font-mono text-neutral-500 uppercase">{cat.tagline}</span>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                  <label className="text-[8px] font-mono uppercase text-neutral-500 block">Sway Headline Line 1</label>
                                  <input 
                                    type="text" 
                                    value={poems.line1} 
                                    onChange={(e) => updateHeroText(cat.id, { line1: e.target.value })} 
                                    className="bg-[#14110f] border border-white/10 rounded-lg px-2 py-1 w-full text-white text-[11px]"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] font-mono uppercase text-neutral-500 block">Sway Headline Line 2</label>
                                  <input 
                                    type="text" 
                                    value={poems.line2} 
                                    onChange={(e) => updateHeroText(cat.id, { line2: e.target.value })} 
                                    className="bg-[#14110f] border border-white/10 rounded-lg px-2 py-1 w-full text-white text-[11px]"
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-[8px] font-mono uppercase text-neutral-500 block">Slider Detail sub-line</label>
                                <input 
                                  type="text" 
                                  value={poems.extra} 
                                  onChange={(e) => updateHeroText(cat.id, { extra: e.target.value })} 
                                  className="bg-[#14110f] border border-white/10 rounded-lg px-2 py-1 w-full text-white text-[11px]"
                                />
                              </div>

                              <div className="flex gap-2 items-center pt-3 select-none">
                                  {/* Bullet reordering simulated handles */}
                                  <button
                                    onClick={() => {
                                      const idx = state.eventCategories.indexOf(cat);
                                      if (idx > 0) {
                                        const copy = [...state.eventCategories];
                                        [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
                                        reorderCategories(copy);
                                      }
                                    }}
                                    className="p-1 px-2 border border-white/5 rounded hover:bg-white/10 text-[9px] font-mono cursor-pointer"
                                    title="Move Slider Up"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const idx = state.eventCategories.indexOf(cat);
                                      if (idx < state.eventCategories.length - 1) {
                                        const copy = [...state.eventCategories];
                                        [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
                                        reorderCategories(copy);
                                      }
                                    }}
                                    className="p-1 px-2 border border-white/5 rounded hover:bg-white/10 text-[9px] font-mono cursor-pointer"
                                    title="Move Slider Down"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* EDITABLE FLORAL EFFECTS SETTINGS */}
                  <div className="p-6 bg-[#14110f] border border-white/5 rounded-3xl space-y-4 text-left">
                    <h3 className="text-xs font-mono text-[#d16126] font-bold uppercase tracking-widest">Floral Effects & Romantic Cascading</h3>
                    <p className="text-neutral-400 text-[11px] font-sans">
                      Introduce a quiet, romantic storytelling layer of cinematic floating flower petals.
                    </p>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-neutral-400 block tracking-widest">Enable Floral Atmosphere</label>
                        <select
                          value={state.themeConfig?.floralEnabled ? 'true' : 'false'}
                          onChange={(e) => updateTheme({ floralEnabled: e.target.value === 'true' })}
                          className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d16126]"
                        >
                          <option value="true">Enabled (Quiet blossom petals fall drifting dynamically)</option>
                          <option value="false">Disabled (Full dark clean modern slate styling)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-neutral-400 block tracking-widest">Petal Density</label>
                        <select
                          value={state.themeConfig?.floralDensity || 'medium'}
                          onChange={(e) => updateTheme({ floralDensity: e.target.value as any })}
                          className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d16126]"
                        >
                          <option value="low">Low (Rare, elegant cinematic highlights)</option>
                          <option value="medium">Medium (Soft organic romantic story)</option>
                          <option value="high">High (Lively cinematic blossom ceremony)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-neutral-400 block tracking-widest">Drifting Speed</label>
                        <select
                          value={state.themeConfig?.floralSpeed || 'medium'}
                          onChange={(e) => updateTheme({ floralSpeed: e.target.value as any })}
                          className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d16126]"
                        >
                          <option value="slow">Slow (Extremely slow, high-end editorial sway)</option>
                          <option value="medium">Medium (Graceful wind drift)</option>
                          <option value="fast">Fast (Lively natural summer breeze)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-neutral-400 block tracking-widest">Flower Style Selection</label>
                        <select
                          value={state.themeConfig?.floralFlowerStyle || 'blush-rose'}
                          onChange={(e) => updateTheme({ floralFlowerStyle: e.target.value as any })}
                          className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d16126]"
                        >
                          <option value="blush-rose">Blush Rose (Delicate pastel pinks)</option>
                          <option value="cherry-blossom">Cherry Blossom (Vivid Sakura white & pink gradients)</option>
                          <option value="gold-champagne">Warm Champagne (Luxury honey & golden hues)</option>
                          <option value="ivory-white">Crisp Ivory & Rose (Timeless editorial white & blush)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SERVICES ATELIER */}
              {activeTab === 'services' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-4xl font-serif text-white tracking-wide">Service Studio Atelier</h2>
                      <p className="text-neutral-400 text-xs mt-1.5">Manage tactical event service structures, core offerings, headlines and parallax graphics.</p>
                    </div>
                    <button
                      onClick={() => {
                        const defaultNewService: Omit<ServiceDetail, 'id'> = {
                          title: 'Intelligent Scenic Design',
                          headline: 'Sculpting high-performance physical structures.',
                          description: 'Custom lighting sculptures and projection-mapped material arrays built for majestic environments.',
                          longDescription: 'We merge software control systems with classical architecture design. Sourcing bespoke glassware, heavy silks, and custom timber tables, we ensure absolute elegance.',
                          image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=600&auto=format&fit=crop',
                          category: 'custom',
                          offerings: ['Kinetic installation designs', 'Precision LED matrices', 'Bespoke materials curation']
                        };
                        addService(defaultNewService);
                        alert('New curated experiential service generated. Edit guidelines below.');
                      }}
                      className="px-4 py-2 border border-[#d16126]/40 hover:bg-[#d16126]/12 hover:scale-[1.02] text-white text-[10px] font-mono uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#d16126]" /> Create New Service
                    </button>
                  </div>

                  {/* EDITABLE SERVICES INTRO SECTION HEADER */}
                  <div className="p-6 bg-[#14110f] border border-white/5 rounded-3xl space-y-4 text-left">
                    <h3 className="text-xs font-mono text-[#d16126] font-bold uppercase tracking-widest">Services Section Introduction Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-mono text-neutral-400 block mb-1">SECTION EYEBROW</label>
                        <input
                          type="text"
                          value={state.themeConfig?.servicesEyebrow || 'OUR SERVICES'}
                          onChange={(e) => updateTheme({ servicesEyebrow: e.target.value })}
                          className="w-full bg-[#0d0a08] border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-sans focus:border-[#d16126] focus:outline-none"
                          placeholder="e.g. OUR SERVICES"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-neutral-400 block mb-1">SECTION MAIN HEADING</label>
                        <input
                          type="text"
                          value={state.themeConfig?.servicesTitle || 'What We Offer'}
                          onChange={(e) => updateTheme({ servicesTitle: e.target.value })}
                          className="w-full bg-[#0d0a08] border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-serif focus:border-[#d16126] focus:outline-none"
                          placeholder="e.g. What We Offer"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-neutral-400 block mb-1">SECTION DESCRIPTION SUPPORTING TEXT</label>
                      <textarea
                        value={state.themeConfig?.servicesDescription || ''}
                        onChange={(e) => updateTheme({ servicesDescription: e.target.value })}
                        className="w-full bg-[#0d0a08] border border-white/10 rounded-lg px-3 py-2 text-white text-xs resize-none focus:border-[#d16126] focus:outline-none"
                        rows={3}
                        placeholder="Premium description of our services offer..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {state.services.map((srv, idx) => {
                      const isEditing = editingServiceId === srv.id;
                      return (
                        <div key={srv.id} className="p-5 bg-[#14110f] border border-white/5 rounded-3xl space-y-4">
                          
                          {/* Top-bar summary */}
                          <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                            <div className="flex items-center space-x-3 text-left">
                              <span className="w-8 h-8 rounded-full bg-[#d16126]/10 flex items-center justify-center text-[#d16126] font-mono text-xs font-bold">{idx + 1}</span>
                              <div>
                                <h4 className="text-sm font-serif font-semibold text-white">{srv.title}</h4>
                                <span className="text-[8px] font-mono uppercase text-neutral-400">{srv.category} module</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  if (isEditing) {
                                    setEditingServiceId(null);
                                  } else {
                                    setEditingServiceId(srv.id);
                                  }
                                }}
                                className="p-1 px-3.5 border border-white/10 hover:border-[#d16126]/60 rounded-xl text-[10px] font-mono uppercase transition-colors text-neutral-300 font-bold cursor-pointer"
                              >
                                {isEditing ? 'Save Changes' : 'Configure Service'}
                              </button>
                              
                              {/* Reordering indicators */}
                              <button
                                onClick={() => {
                                  if (idx > 0) {
                                    const copy = [...state.services];
                                    [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
                                    reorderServices(copy);
                                  }
                                }}
                                className="p-1.5 border border-white/5 rounded-xl hover:bg-white/10 cursor-pointer"
                                title="Move up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              
                              <button
                                onClick={() => {
                                  if (idx < state.services.length - 1) {
                                    const copy = [...state.services];
                                    [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
                                    reorderServices(copy);
                                  }
                                }}
                                className="p-1.5 border border-white/5 rounded-xl hover:bg-white/10 cursor-pointer"
                                title="Move down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`Delete service: "${srv.title}" from Gather Studio?`)) {
                                    deleteService(srv.id);
                                  }
                                }}
                                className="p-1.5 border border-red-500/10 text-red-400 hover:bg-red-500/10 rounded-xl cursor-pointer"
                                title="Delete service"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Dynamic Expanded values for editing */}
                          {isEditing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                              <div className="space-y-3">
                                <div>
                                  <label className="text-[9px] font-mono text-neutral-400 uppercase">Service Name Title</label>
                                  <input
                                    type="text"
                                    value={srv.title}
                                    onChange={(e) => updateService(srv.id, { title: e.target.value })}
                                    className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-[#d16126]"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-mono text-neutral-400 uppercase">Atelier Slogan Headline</label>
                                  <input
                                    type="text"
                                    value={srv.headline}
                                    onChange={(e) => updateService(srv.id, { headline: e.target.value })}
                                    className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-[#d16126]"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-mono text-neutral-400 uppercase">Core Category Allocation</label>
                                  <select
                                    value={srv.category}
                                    onChange={(e) => updateService(srv.id, { category: e.target.value as EventType })}
                                    className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                                  >
                                    <option value="weddings">Weddings</option>
                                    <option value="corporate">Corporate</option>
                                    <option value="birthdays">Birthdays & Anniversary</option>
                                    <option value="galas">Galas & Splendor</option>
                                    <option value="custom">Bespoke / Custom</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[9px] font-mono text-neutral-400 uppercase">Primary Background Media URL</label>
                                  <input
                                    type="text"
                                    value={srv.image}
                                    onChange={(e) => updateService(srv.id, { image: e.target.value })}
                                    className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-2.5 py-2 text-white font-mono focus:outline-none focus:border-[#d16126]"
                                  />
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="text-[9px] font-mono text-neutral-400 uppercase">Cognitive Description (Intro)</label>
                                  <textarea
                                    rows={2}
                                    value={srv.description}
                                    onChange={(e) => updateService(srv.id, { description: e.target.value })}
                                    className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-2.5 py-2 text-white focus:outline-none resize-none focus:border-[#d16126]"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-mono text-neutral-400 uppercase">Detailed Narrative blueprint</label>
                                  <textarea
                                    rows={4}
                                    value={srv.longDescription}
                                    onChange={(e) => updateService(srv.id, { longDescription: e.target.value })}
                                    className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-2.5 py-2 text-white focus:outline-none resize-none focus:border-[#d16126] leading-relaxed"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-light text-neutral-400">
                              <p className="sm:col-span-2">
                                <b className="text-white block font-serif uppercase tracking-wider mb-1 text-[11px]">{srv.headline}</b>
                                {srv.description}
                              </p>
                              <div>
                                <b className="text-[#d16126] font-mono block tracking-widest text-[9px] uppercase mb-1">Standard Offerings</b>
                                <ul className="space-y-1 list-none font-mono text-[9px]">
                                  {srv.offerings.map((off, idx) => (
                                    <li key={idx} className="truncate">▪ {off}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: PORTFOLIO STUDIO */}
              {activeTab === 'portfolio' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-4xl font-serif text-white tracking-wide">Gather Portfolio Studio</h2>
                      <p className="text-neutral-400 text-xs mt-1.5">Chronicle past master events, write stories on physical transformations, and feature top cases.</p>
                    </div>
                    <button
                      onClick={() => {
                        const defaultProj: Omit<CaseStudy, 'id'> = {
                          title: 'Imperial Autumn Solstice',
                          client: 'Vickers Heritage Estate',
                          category: 'weddings',
                          location: 'Highland Castles, Scotland',
                          summary: 'An opulent highland castle banquet with 1,500 hanging lanterns and ancient string instrument orchestrations.',
                          story: 'The Sterling family requested a deep-wood atmosphere in keeping with standard Scottish heritage rules.',
                          goals: 'Establish deep sensory memories for 80 select guests.',
                          transformation: 'We engineered hanging floral chandeliers and continuous custom violin acoustics.',
                          testimonial: {
                            quote: "A sublime sensory story. Far exceeded our standard guidelines.",
                            author: "Lord Sterling V.",
                            role: "Patron"
                          },
                          image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800',
                          gallery: ['https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop']
                        };
                        addProject(defaultProj);
                        alert('New bespoke portfolio narrative created. Configure event data below.');
                      }}
                      className="px-4 py-2 border border-[#d16126]/40 hover:bg-[#d16126]/12 text-white text-[10px] font-mono uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#d16126]" /> Create Event Chronicle
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {state.portfolioProjects.map((proj, idx) => {
                      const isEditing = editingProjectId === proj.id;
                      return (
                        <div key={proj.id} className="p-5 bg-[#14110f] border border-white/5 rounded-3xl space-y-4 text-left">
                          
                          {/* Top row controls */}
                          <div className="flex justify-between items-center pb-2.5 border-b border-white/5 flex-wrap gap-2">
                            <div className="flex items-center space-x-3">
                              <span className="text-[10px] bg-[#d16126]/10 text-[#d16126] font-mono px-2.5 py-1 rounded-lg">ID: {proj.id}</span>
                              <h4 className="text-sm font-serif font-semibold text-white">{proj.title}</h4>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  if (isEditing) {
                                    setEditingProjectId(null);
                                  } else {
                                    setEditingProjectId(proj.id);
                                  }
                                }}
                                className="px-3 py-1 bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-mono border border-white/10 rounded-lg cursor-pointer"
                              >
                                {isEditing ? 'Minimize' : 'Assemble Case'}
                              </button>

                              <button
                                onClick={() => {
                                  if (idx > 0) {
                                    const copy = [...state.portfolioProjects];
                                    [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
                                    reorderProjects(copy);
                                  }
                                }}
                                className="p-1 border border-white/5 rounded-xl hover:bg-white/10 cursor-pointer"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              
                              <button
                                onClick={() => {
                                  if (idx < state.portfolioProjects.length - 1) {
                                    const copy = [...state.portfolioProjects];
                                    [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
                                    reorderProjects(copy);
                                  }
                                }}
                                className="p-1 border border-white/5 rounded-xl hover:bg-white/10 cursor-pointer"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`Remove event story "${proj.title}" from Gather chronicled data?`)) {
                                    deleteProject(proj.id);
                                  }
                                }}
                                className="p-1 border border-red-500/10 text-red-400 hover:bg-red-500/10 rounded-xl cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Complex Event Editor */}
                          {isEditing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                              <div className="space-y-3">
                                <div>
                                  <label className="text-[9px] font-mono text-neutral-400 uppercase">Event Name</label>
                                  <input
                                    type="text"
                                    value={proj.title}
                                    onChange={(e) => updateProject(proj.id, { title: e.target.value })}
                                    className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-2.5 py-2 text-white"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[9px] font-mono text-neutral-400 uppercase">Client</label>
                                    <input
                                      type="text"
                                      value={proj.client}
                                      onChange={(e) => updateProject(proj.id, { client: e.target.value })}
                                      className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-2.5 py-2 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-mono text-neutral-400 uppercase">Sway Location</label>
                                    <input
                                      type="text"
                                      value={proj.location}
                                      onChange={(e) => updateProject(proj.id, { location: e.target.value })}
                                      className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-2.5 py-2 text-white"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[9px] font-mono text-neutral-400 uppercase">Category Anchor</label>
                                    <select
                                      value={proj.category}
                                      onChange={(e) => updateProject(proj.id, { category: e.target.value as EventType })}
                                      className="w-full bg-[#0d0a08] text-neutral-200 border border-white/10 rounded-xl px-3 py-2"
                                    >
                                      <option value="weddings">Weddings</option>
                                      <option value="corporate">Corporate</option>
                                      <option value="birthdays">Birthdays</option>
                                      <option value="galas font-serif">Grand Galas</option>
                                      <option value="custom font-serif">Bespoke / Custom</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-mono text-neutral-400 uppercase">Testimonial Author</label>
                                    <input
                                      type="text"
                                      value={proj.testimonial?.author || ''}
                                      onChange={(e) => updateProject(proj.id, { testimonial: { ...proj.testimonial, author: e.target.value } as any })}
                                      className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-2.5 py-2 text-white"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[9px] font-mono text-neutral-400 uppercase">Featured Visual Cover URL</label>
                                  <input
                                    type="text"
                                    value={proj.image}
                                    onChange={(e) => updateProject(proj.id, { image: e.target.value })}
                                    className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-2 py-2 text-white font-mono"
                                  />
                                </div>

                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="text-[9px] font-mono text-neutral-400 uppercase">Chronicle Summary (Overview text)</label>
                                  <textarea
                                    rows={2}
                                    value={proj.summary}
                                    onChange={(e) => updateProject(proj.id, { summary: e.target.value })}
                                    className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-2.5 py-2 text-white focus:outline-none resize-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-mono text-neutral-400 uppercase">Interactive Story narrative</label>
                                  <textarea
                                    rows={3}
                                    value={proj.story}
                                    onChange={(e) => updateProject(proj.id, { story: e.target.value })}
                                    className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-2.5 py-2 text-white focus:outline-none resize-none"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[9px] font-mono text-neutral-400 uppercase">Sensory Goals</label>
                                    <textarea
                                      rows={2}
                                      value={proj.goals || ''}
                                      onChange={(e) => updateProject(proj.id, { goals: e.target.value })}
                                      className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-2 py-1 text-white focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-mono text-neutral-400 uppercase">Transformation Deliverables</label>
                                    <textarea
                                      rows={2}
                                      value={proj.transformation || ''}
                                      onChange={(e) => updateProject(proj.id, { transformation: e.target.value })}
                                      className="w-full bg-[#0d0a08] border border-[#d16126]/30 rounded-xl px-2 py-1 text-white focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[9px] font-mono text-neutral-400 uppercase">Client Testimonial Quote</label>
                                  <input
                                    type="text"
                                    value={proj.testimonial?.quote || ''}
                                    onChange={(e) => updateProject(proj.id, { testimonial: { ...proj.testimonial, quote: e.target.value } as any })}
                                    className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-2.5 py-2 text-white"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs text-neutral-400 font-light">
                              <div>
                                <img src={proj.image || null} className="w-full aspect-[4/3] object-cover rounded-xl border border-white/10" alt={proj.title} />
                                <span className="text-[9px] font-mono text-neutral-500 uppercase mt-2 block italic">Location: {proj.location}</span>
                              </div>
                              <div className="sm:col-span-3 space-y-2">
                                <p className="text-white font-serif">{proj.summary}</p>
                                <p className="leading-relaxed text-[11px]"><b className="text-neutral-200">The Story:</b> {proj.story}</p>
                                {proj.testimonial && (
                                  <div className="border-l border-[#d16126] pl-3 py-1 font-serif text-[#d16126] italic text-[11px] bg-white/[0.01]">
                                    "{proj.testimonial.quote}"
                                    <span className="block font-sans font-mono uppercase text-neutral-500 tracking-widest text-[8px] mt-1">
                                      - {proj.testimonial.author}, {proj.testimonial.role || 'Guest of Honor'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: GALLERY CURATION */}
              {activeTab === 'gallery' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-4xl font-serif text-white tracking-wide">Gallery Curation Lab</h2>
                    <p className="text-neutral-400 text-xs mt-1.5">Configure featured image galleries, masonry alignments, and live Vimeo file loops.</p>
                  </div>

                  <div className="bg-[#14110f] border border-white/5 p-6 rounded-3xl space-y-6">
                    <h3 className="text-xs font-mono uppercase text-[#d16126] tracking-widest font-bold">Fast Media Allocations</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {state.portfolioProjects.map((proj) => (
                        <div key={proj.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl space-y-2 text-left">
                          <img src={proj.image || null} className="w-full aspect-[16/10] object-cover rounded-lg border border-white/5" alt={proj.title} />
                          <div className="space-y-1">
                            <span className="text-[10px] font-serif text-white block truncate">{proj.title}</span>
                            <span className="text-[8px] font-mono text-[#d16126] block uppercase font-bold tracking-wider">{proj.category}</span>
                          </div>
                          
                          {/* Simulated image reordering and metadata optimization */}
                          <div className="flex justify-between items-center text-[9px] font-mono text-neutral-400 pt-1 border-t border-white/5">
                            <span>{proj.gallery?.length || 2} Slides</span>
                            <button
                              onClick={() => {
                                const newPic = prompt("Add high-res image URL to this project gallery compilation:", "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600");
                                if (newPic) {
                                  const list = proj.gallery ? [...proj.gallery, newPic] : [newPic];
                                  updateProject(proj.id, { gallery: list });
                                  alert('Sensory asset cached successfully.');
                                }
                              }}
                              className="text-white font-bold hover:text-[#d16126] cursor-pointer"
                            >
                              + Add Image
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-white/[0.01] border border-[#d16126]/20 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-0.5 text-left">
                        <span className="text-xs font-serif text-white block">Media Auto-Pilot and Optimization Engine</span>
                        <p className="text-[10px] text-neutral-400 leading-relaxed font-light">
                          Simulate client compressing, responsive WebP asset caching pipelines, and Vimeo auto-buffering optimizations.
                        </p>
                      </div>
                      <button
                        onClick={() => alert('Media pipeline diagnostics: All 8 high-performance Vimeo streams validated and optimized!')}
                        className="px-4 py-2 bg-[#d16126] text-white hover:bg-[#b04a18] text-[9.5px] font-mono uppercase tracking-widest rounded-xl transition"
                      >
                        Run Media Optimization Diagnostics
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: CLIENT TESTIMONIALS */}
              {activeTab === 'testimonials' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-4xl font-serif text-white tracking-wide">Client Testimonial Voices</h2>
                      <p className="text-neutral-400 text-xs mt-1.5">Manage user client stories, profiles, photos, and category milestone associations.</p>
                    </div>
                    <button
                      onClick={() => {
                        const newStory: ClientStory = {
                          quote: "They designed how we remember. The operational rhythm felt completely natural, completely invisible.",
                          author: "Sovereign Arts Chairperson",
                          role: "London Regent Gentry",
                          eventDate: "March 2026",
                          category: 'galas',
                          image: 'https://images.unsplash.com/photo-1505232458627-a72726f5b710?q=80&w=600'
                        };
                        addTestimonial(newStory);
                        alert('New curated testimonial recollection logged.');
                      }}
                      className="px-4 py-2 border border-[#d16126]/40 hover:bg-[#d16126]/12 text-white text-[10px] font-mono uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                    >
                      + Add Recollection
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {state.clientStories.map((story, index) => {
                      const isEditing = editingTestimonialIdx === index;
                      return (
                        <div key={index} className="p-5 bg-[#14110f] border border-white/5 rounded-3xl space-y-3 text-left">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-xs uppercase font-serif font-bold text-white tracking-widest">Recollection #{index + 1}</span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setEditingTestimonialIdx(isEditing ? null : index)}
                                className="px-3 py-1 bg-white/[0.04] text-[9px] font-mono border border-white/10 rounded-lg cursor-pointer"
                              >
                                {isEditing ? 'Save' : 'Modify'}
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this client story permanently?')) {
                                    deleteTestimonial(index);
                                  }
                                }}
                                className="p-1 border border-red-500/10 text-red-400 hover:bg-red-500/10 rounded-xl cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {isEditing ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1.5 ">
                              <div className="space-y-3">
                                <div>
                                  <label className="text-[9px] font-mono text-neutral-400">Author signature name</label>
                                  <input
                                    type="text"
                                    value={story.author}
                                    onChange={(e) => updateTestimonial(index, { author: e.target.value })}
                                    className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-2 py-1.5 text-white text-xs"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9px] font-mono text-neutral-400">Role</label>
                                    <input
                                      type="text"
                                      value={story.role}
                                      onChange={(e) => updateTestimonial(index, { role: e.target.value })}
                                      className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-2 py-1.5 text-white text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-mono text-neutral-400">Milestone Date</label>
                                    <input
                                      type="text"
                                      value={story.eventDate}
                                      onChange={(e) => updateTestimonial(index, { eventDate: e.target.value })}
                                      className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-2 py-1.5 text-white text-xs"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="text-[9px] font-mono text-neutral-400">Client Quote</label>
                                  <input
                                    type="text"
                                    value={story.quote}
                                    onChange={(e) => updateTestimonial(index, { quote: e.target.value })}
                                    className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-2 py-1.5 text-white text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-mono text-neutral-400">Portrait Image URL</label>
                                  <input
                                    type="text"
                                    value={story.image}
                                    onChange={(e) => updateTestimonial(index, { image: e.target.value })}
                                    className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-2 py-1.5 text-white text-xs font-mono"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-4 items-center">
                              <img src={story.image || null} className="w-12 h-12 rounded-full object-cover border border-white/10" alt={story.author} />
                              <div>
                                <p className="text-white italic text-[11px] font-serif">"{story.quote}"</p>
                                <span className="block text-[9px] font-mono text-neutral-400 uppercase tracking-widest mt-1">
                                  {story.author} &mdash; {story.role} ({story.eventDate})
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 7: TEAM MEMBERS */}
              {activeTab === 'team' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-4xl font-serif text-white tracking-wide">Creative Atelier Team</h2>
                      <p className="text-neutral-400 text-xs mt-1.5">Manage lead team members, roles, executive bio narratives, and portrait profiles.</p>
                    </div>
                    <button
                      onClick={() => {
                        const newMem: Omit<TeamMember, 'id'> = {
                          name: 'Julian Thorne',
                          role: 'Lead Lighting Architect',
                          bio: 'Translating photons into cinematic spatial depth fields.',
                          portrait: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400',
                          socialLinks: { email: 'j.thorne@gather.com' }
                        };
                        addTeamMember(newMem);
                        alert('New Atelier executive logged successfully.');
                      }}
                      className="px-4 py-2 border border-[#d16126]/40 hover:bg-[#d16126]/12 text-white text-[10px] font-mono uppercase tracking-widest rounded-xl cursor-pointer"
                    >
                      + Add Team Member
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {state.teamMembers?.map((member) => {
                      const isEditing = editingTeamId === member.id;
                      return (
                        <div key={member.id} className="p-4 bg-[#14110f] border border-white/5 rounded-3xl space-y-4 text-left">
                          <img src={member.portrait || null} className="w-full aspect-[4/5] object-cover rounded-2xl border border-white/5" alt={member.name} />
                          
                          <div className="space-y-2">
                            {isEditing ? (
                              <div className="space-y-2 text-xs">
                                <input
                                  type="text"
                                  value={member.name}
                                  onChange={(e) => updateTeamMember(member.id, { name: e.target.value })}
                                  className="w-full bg-[#0d0a08] border border-white/10 rounded-lg px-2 py-1 text-white text-xs"
                                  placeholder="Full Name"
                                />
                                <input
                                  type="text"
                                  value={member.role}
                                  onChange={(e) => updateTeamMember(member.id, { role: e.target.value })}
                                  className="w-full bg-[#0d0a08] border border-white/10 rounded-lg px-2 py-1 text-white text-xs"
                                  placeholder="Exclusive title"
                                />
                                <textarea
                                  value={member.bio}
                                  onChange={(e) => updateTeamMember(member.id, { bio: e.target.value })}
                                  className="w-full bg-[#0d0a08] border border-white/10 rounded-lg px-2 py-1 text-white text-xs resize-none"
                                  rows={3}
                                />
                                <input
                                  type="text"
                                  value={member.portrait}
                                  onChange={(e) => updateTeamMember(member.id, { portrait: e.target.value })}
                                  className="w-full bg-[#0d0a08] border border-white/10 rounded-lg px-2 py-1 text-white text-[10px] font-mono"
                                />
                              </div>
                            ) : (
                              <div>
                                <h4 className="text-sm font-serif font-semibold text-white">{member.name}</h4>
                                <span className="text-[9px] font-mono uppercase text-[#d16126] block tracking-widest">{member.role}</span>
                                <p className="text-[11px] text-neutral-400 font-light leading-relaxed mt-2">{member.bio}</p>
                              </div>
                            )}

                            <div className="flex justify-between items-center border-t border-white/5 pt-3">
                              <button
                                onClick={() => setEditingTeamId(isEditing ? null : member.id)}
                                className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider hover:text-white cursor-pointer"
                              >
                                {isEditing ? 'Save Bio' : 'Modify Bio'}
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`Remove ${member.name} from Gather team index?`)) {
                                    deleteTeamMember(member.id);
                                  }
                                }}
                                className="text-red-400 hover:text-red-500 cursor-pointer"
                                title="Remove member"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 8: CRM INQUIRIES */}
              {activeTab === 'crm' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-4xl font-serif text-white tracking-wide">Inbound Client CRM Registry</h2>
                    <p className="text-neutral-400 text-xs mt-1.5">Check and progression-gate client registrations, budget thresholds, and custom synthesized theme proposals.</p>
                  </div>

                  {/* Filter elements block */}
                  <div className="flex flex-wrap gap-4 items-center justify-between pb-2 border-b border-white/5">
                    <div className="relative flex-1 min-w-[200px]">
                      <span className="absolute inset-y-0 left-3 flex items-center text-neutral-500">
                        <Search className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        placeholder="Search signatures or references..."
                        value={crmSearch}
                        onChange={(e) => setCrmSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-[#14110f] border border-white/10 rounded-xl text-xs text-white focus:outline-none w-full"
                      />
                    </div>

                    <div className="flex space-x-2">
                      {['All', 'New', 'Contacted', 'Proposal Sent', 'Confirmed', 'Completed'].map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setCrmStatusFilter(lvl)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider border cursor-pointer transition-colors ${
                            crmStatusFilter === lvl 
                              ? 'bg-[#d16126] border-[#d16126] text-white' 
                              : 'bg-transparent border-white/5 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Detailed spreadsheets table list */}
                  <div className="space-y-4">
                    {state.inquiries
                      .filter(inq => {
                        const mName = inq.fullName?.toLowerCase().includes(crmSearch.toLowerCase()) || inq.id?.includes(crmSearch);
                        const mStatus = crmStatusFilter === 'All' || inq.status === crmStatusFilter;
                        return mName && mStatus;
                      })
                      .map((inq) => (
                        <div key={inq.id} className="p-5 bg-[#14110f] border border-white/5 rounded-3xl space-y-4 text-left">
                          
                          <div className="flex justify-between items-start border-b border-white/5 pb-3 flex-wrap gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-[#d16126] uppercase font-bold tracking-widest">{inq.id}</span>
                                <span className="text-[9px] font-mono text-neutral-500">Submitted: {inq.submittedAt || 'Today'}</span>
                              </div>
                              <h4 className="text-sm font-serif font-semibold text-white">{inq.fullName}</h4>
                              <p className="text-[11px] text-neutral-400 font-mono">{inq.email} | {inq.phone || '+1 (555) 018-2831'}</p>
                            </div>

                            {/* Status progression select bar */}
                            <div className="flex items-center space-x-3">
                              <span className="text-[9px] font-mono text-neutral-400 uppercase">Interactive Status</span>
                              <select
                                value={inq.status}
                                onChange={(e) => {
                                  updateInquiryStatus(inq.id, e.target.value as any);
                                  alert(`Client sequence updated to: "${e.target.value}"`);
                                }}
                                className="bg-[#0d0a08] border border-white/10 text-neutral-200 text-[10px] font-mono rounded-lg px-3 py-1.5 focus:outline-none"
                              >
                                <option value="New">● New Inbound</option>
                                <option value="Contacted">● Staff Contacted</option>
                                <option value="Proposal Sent">● Proposal Sent</option>
                                <option value="Confirmed">● Booking Confirmed</option>
                                <option value="Completed">● Completed Memory</option>
                              </select>
                            </div>
                          </div>

                          {/* Secondary brief details block */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-neutral-400 font-mono pb-2">
                            <div>Event Type: <b className="text-white capitalize">{inq.eventType}</b></div>
                            <div>Execution Date: <b className="text-white">{inq.date}</b></div>
                            <div>Budget Scale: <b className="text-white italic">{inq.budgetRange}</b></div>
                          </div>

                          <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl">
                            <span className="text-[9px] font-mono uppercase text-neutral-400 block mb-1">Inbound Message Narrative</span>
                            <p className="text-xs text-neutral-300 font-light leading-relaxed">"{inq.message}"</p>
                          </div>

                          {inq.proposalConcept && (
                            <div className="p-4 bg-amber-950/20 border border-[#d16126]/30 rounded-2xl flex flex-wrap gap-4 justify-between items-center">
                              <div className="text-left space-y-0.5">
                                <span className="text-[8px] font-mono text-brand-gold uppercase block">Draft Theme Proposal Synthesized</span>
                                <h5 className="text-xs font-serif text-white">{inq.proposalConcept.themeName}</h5>
                                <p className="text-[10px] text-neutral-400 font-light leading-relaxed truncate max-w-lg">{inq.proposalConcept.description}</p>
                              </div>
                              <button
                                onClick={() => {
                                  const name = prompt('Rename spatial theme proposal:', inq.proposalConcept?.themeName);
                                  const desc = prompt('Update narrative core description:', inq.proposalConcept?.description);
                                  if (name && desc) {
                                    saveInquiryProposal(inq.id, {
                                      ...inq.proposalConcept!,
                                      themeName: name,
                                      description: desc
                                    });
                                    alert('Proposal configuration cached.');
                                  }
                                }}
                                className="px-3 py-1 bg-white/[0.04] text-[9px] text-[#d16126] uppercase font-mono tracking-widest rounded border border-[#d16126]/40 hover:bg-[#d16126]/10"
                              >
                                Edit Concept
                              </button>
                            </div>
                          )}

                        </div>
                      ))}

                    {state.inquiries.length === 0 && (
                      <div className="h-40 flex flex-col justify-center items-center text-center text-neutral-500 border border-white/5 rounded-3xl">
                        <ClipboardList className="w-8 h-8 text-neutral-600 mb-2" />
                        <p className="text-xs font-mono lowercase">no registered crm entries found.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 10: NAVIGATION MANAGER */}
              {activeTab === 'navigation' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-4xl font-serif text-white tracking-wide">Website Navigation Manager</h2>
                    <p className="text-neutral-400 text-xs mt-1.5">Rename navigation links block, reorder website screen files structure, or hide/show sections seamlessly.</p>
                  </div>

                  <div className="bg-[#14110f] border border-white/5 p-6 rounded-3xl space-y-4 text-left">
                    <h3 className="text-xs font-mono uppercase text-[#d16126] tracking-widest font-bold">Dynamic Screen Mount Sequence</h3>
                    
                    <div className="space-y-2">
                      {state.navigationItems
                        .sort((a,b) => a.order - b.order)
                        .map((item, idx) => (
                          <div key={item.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between">
                            <div className="flex items-center space-x-3 text-xs">
                              <span className="w-5 h-5 rounded bg-white/5 flex items-center justify-center font-mono text-[9px] text-[#d16126]">#{idx + 1}</span>
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateNavigationItem(item.id, { name: e.target.value })}
                                className="bg-[#0b0807] border border-white/5 rounded px-2.5 py-1 text-white text-xs font-serif min-w-[160px]"
                              />
                              <span className="text-[9px] font-mono text-neutral-500 uppercase">Section: {item.sectionId}</span>
                            </div>

                            <div className="flex items-center space-x-3.5">
                              {/* Toggle visibility */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-mono text-neutral-400 uppercase">Visible</span>
                                <input
                                  type="checkbox"
                                  checked={item.visible}
                                  onChange={(e) => updateNavigationItem(item.id, { visible: e.target.checked })}
                                  className="w-3.5 h-3.5 accent-[#d16126] cursor-pointer"
                                />
                              </div>

                              {/* Simple reordering buttons */}
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => {
                                    if (idx > 0) {
                                      const copy = [...state.navigationItems];
                                      const preOrder = copy[idx - 1].order;
                                      copy[idx - 1].order = item.order;
                                      item.order = preOrder;
                                      reorderNavigationItems(copy);
                                    }
                                  }}
                                  className="p-1 hover:bg-white/5 rounded"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (idx < state.navigationItems.length - 1) {
                                      const copy = [...state.navigationItems];
                                      const postOrder = copy[idx + 1].order;
                                      copy[idx + 1].order = item.order;
                                      item.order = postOrder;
                                      reorderNavigationItems(copy);
                                    }
                                  }}
                                  className="p-1 hover:bg-white/5 rounded"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 11: SEO MANAGER */}
              {activeTab === 'seo' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-4xl font-serif text-white tracking-wide">SEO Metadata Architect</h2>
                    <p className="text-neutral-400 text-xs mt-1.5">Define metadata titles tags, meta crawls descriptions, Open Graph media wrappers, and social signatures.</p>
                  </div>

                  <div className="bg-[#14110f] border border-white/5 p-6 rounded-3xl space-y-4 text-left">
                    <div className="space-y-3 text-xs">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-neutral-400">Page Document Title Tag</label>
                        <input
                          type="text"
                          value={state.seoConfig.pageTitle}
                          onChange={(e) => updateSEO({ pageTitle: e.target.value })}
                          className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2.5 text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-neutral-400">Meta Crawler Description (Google index summaries)</label>
                        <textarea
                          rows={3}
                          value={state.seoConfig.metaDescription}
                          onChange={(e) => updateSEO({ metaDescription: e.target.value })}
                          className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2.5 text-white resize-none leading-relaxed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-neutral-400">Open Graph (OG) Branding Image URL</label>
                        <input
                          type="text"
                          value={state.seoConfig.ogImage}
                          onChange={(e) => updateSEO({ ogImage: e.target.value })}
                          className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-neutral-400">Social Sharing Default Content Block</label>
                        <textarea
                          rows={2}
                          value={state.seoConfig.socialShareContent}
                          onChange={(e) => updateSEO({ socialShareContent: e.target.value })}
                          className="w-full bg-[#0d0a08] border border-[#d16126]/30 rounded-xl px-3 py-2.5 text-white resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
                  {/* TAB 12: CENTRAL MEDIA LIBRARY WITH INTERACTIVE PORTAL */}
              {activeTab === 'media' && (
                <div className="space-y-10 animate-fade-in text-neutral-200">
                  {/* Page Header */}
                  <div className="border-b border-white/10 pb-6 flex justify-between items-end flex-wrap gap-4">
                    <div>
                      <h2 className="text-4xl font-serif text-white tracking-wide">Cinematic Arcade & Categories Studio</h2>
                      <p className="text-neutral-400 text-xs mt-1.5 font-sans">
                        Configure, edit, and organize raw cinematic event footage & dynamic custom categories—redefining the Services section experience live.
                      </p>
                    </div>
                  </div>

                  {/* Big Responsive Grid: Left side for Media Assets (Videos), Right side for Categories Management Panel */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* LEFT COLUMN: Media Archives (lg:col-span-8) */}
                    <div className="lg:col-span-8 space-y-8">
                      
                      {/* Card: Add/Archive New Media */}
                      <div className="bg-[#14110f] border border-white/5 rounded-2xl p-6 space-y-4">
                        <h3 className="text-sm font-mono uppercase tracking-wider text-[#d16126] font-bold border-b border-white/5 pb-2">
                          + Custom Archive New Cinematic Video
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {/* Title */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono uppercase text-neutral-400">Video Title *</label>
                            <input
                              type="text"
                              placeholder="e.g. Northern Sovereign Palace Entrance"
                              value={newMediaName}
                              onChange={(e) => setNewMediaName(e.target.value)}
                              className="bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-neutral-600 focus:border-[#d16126] focus:outline-none"
                            />
                          </div>

                          {/* Category Dropdown */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono uppercase text-neutral-400">Category Assignment *</label>
                            <select
                              value={newMediaCategory}
                              onChange={(e) => setNewMediaCategory(e.target.value)}
                              className="bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:border-[#d16126] focus:outline-none"
                            >
                              <option value="">-- Select Category --</option>
                              {state.eventCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.title}</option>
                              ))}
                            </select>
                          </div>

                          {/* Description */}
                          <div className="flex flex-col gap-1.5 md:col-span-2">
                            <label className="text-[10px] font-mono uppercase text-neutral-400">Description</label>
                            <textarea
                              placeholder="Describe this cinematic event experience detail..."
                              value={newMediaDescription}
                              onChange={(e) => setNewMediaDescription(e.target.value)}
                              className="bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-neutral-600 focus:border-[#d16126] focus:outline-none h-16 resize-none"
                            />
                          </div>

                          {/* Badge & Event Date */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono uppercase text-neutral-400">Badge Label (e.g. CERTIFIED OUTCOME)</label>
                            <input
                              type="text"
                              placeholder="CERTIFIED OUTCOME"
                              value={newMediaBadge}
                              onChange={(e) => setNewMediaBadge(e.target.value)}
                              className="bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-neutral-600 font-sans"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono uppercase text-neutral-400">Event Date (e.g. OCT 2026)</label>
                            <input
                              type="text"
                              placeholder="OCT 2026"
                              value={newMediaDate}
                              onChange={(e) => setNewMediaDate(e.target.value)}
                              className="bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-neutral-600 font-sans"
                            />
                          </div>

                          {/* Display Order & Thumbnail Poster Image */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono uppercase text-neutral-400">Display Order</label>
                            <input
                              type="number"
                              value={newMediaDisplayOrder}
                              onChange={(e) => setNewMediaDisplayOrder(Number(e.target.value))}
                              className="bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2 text-white text-xs"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono uppercase text-neutral-400">Poster Image URL (Thumbnail)</label>
                            <input
                              type="text"
                              placeholder="https://images.unsplash.com/... or upload"
                              value={newMediaPosterImage}
                              onChange={(e) => setNewMediaPosterImage(e.target.value)}
                              className="bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-neutral-600"
                            />
                          </div>

                          {/* Featured toggle & Status select */}
                          <div className="flex items-center gap-4 bg-[#0d0a08] border border-white/10 rounded-xl p-3">
                            <input
                              type="checkbox"
                              id="newMediaFeatured"
                              checked={newMediaFeatured}
                              onChange={(e) => setNewMediaFeatured(e.target.checked)}
                              className="w-4 h-4 rounded border-white/10 accent-[#d16126] cursor-pointer"
                            />
                            <label htmlFor="newMediaFeatured" className="text-xs text-neutral-300 cursor-pointer font-medium">
                              Featured Event Media
                            </label>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono uppercase text-neutral-400">Visibility Status</label>
                            <select
                              value={newMediaStatus}
                              onChange={(e) => setNewMediaStatus(e.target.value as 'Active' | 'Hidden')}
                              className="bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:border-[#d16126]"
                            >
                              <option value="Active">Active / Visible</option>
                              <option value="Hidden">Hidden</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono uppercase text-neutral-400">Storytelling Process Stage</label>
                            <select
                              value={newMediaProcessStage}
                              onChange={(e) => setNewMediaProcessStage(e.target.value as any)}
                              className="bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:border-[#d16126]"
                            >
                              <option value="">None / Standard Archive Item</option>
                              <option value="Vision">Vision (Stage 1)</option>
                              <option value="Blueprint">Blueprint (Stage 2)</option>
                              <option value="Build">Build (Stage 3)</option>
                              <option value="Moment">Moment (Stage 4)</option>
                              <option value="Legacy">Legacy (Stage 5)</option>
                            </select>
                          </div>
                        </div>

                        {/* Interactive drag-and-drop or local file selector */}
                        <div className="border border-white/5 bg-[#090706] p-4 rounded-xl flex flex-col gap-3">
                          <span className="text-[10px] font-mono uppercase text-[#d16126] font-bold">Select raw video file</span>
                          <div className="p-5 border border-dashed border-[#d16126]/30 bg-black/40 hover:border-[#d16126]/60 rounded-xl flex flex-col items-center justify-center text-center gap-2 transition-all relative overflow-hidden">
                            {isUploading ? (
                              <div className="py-2 space-y-1.5 flex flex-col items-center justify-center">
                                <RefreshCw className="w-6 h-6 text-[#d16126] animate-spin" />
                                <span className="text-[10px] font-mono text-amber-400 font-bold">{uploadStatus}</span>
                              </div>
                            ) : (
                              <label className="cursor-pointer w-full flex flex-col items-center justify-center py-2 select-none">
                                <UploadCloud className="w-8 h-8 text-[#d16126] mb-1.5" />
                                <span className="text-xs font-semibold text-white block font-sans">Upload Cinematic Event Video</span>
                                <span className="text-[8px] font-mono text-neutral-400 block mt-0.5">Supports MP4, WebM (auto syncing)</span>
                                {tempPreviewUrl && (
                                  <div className="mt-2 space-y-1">
                                    <span className="text-amber-400 font-mono text-[9px] block">
                                      Immediate Local Visual Preview (Active):
                                    </span>
                                    <video 
                                      src={tempPreviewUrl} 
                                      muted 
                                      autoPlay 
                                      loop 
                                      playsInline
                                      preload="auto"
                                      crossOrigin="anonymous"
                                      onError={(e) => {
                                        const v = e.currentTarget;
                                        console.error("!!! ADMIN TEMP PREVIEW VIDEO LOAD ERROR !!!", {
                                          src: v.src,
                                          code: v.error?.code,
                                          message: v.error?.message,
                                          networkState: v.networkState,
                                          readyState: v.readyState
                                        });
                                      }}
                                      className="w-24 aspect-[16/10] bg-black rounded border border-white/10 mx-auto"
                                    />
                                  </div>
                                )}
                                {newMediaUrl && (
                                  <span className="mt-2 text-emerald-400 font-mono text-[9px] truncate max-w-xs block select-all">
                                    Persistent CDN Asset Saved: {newMediaUrl}
                                  </span>
                                )}
                                <input
                                  type="file"
                                  accept="video/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setIsUploading(true);
                                      setUploadStatus('Uploading file to persistent system storage...');
                                      
                                      // Generate direct preview-only Blob URL for immediate visual layer feedback
                                      const previewObjUrl = URL.createObjectURL(file);
                                      setTempPreviewUrl(previewObjUrl);
                                      
                                      if (!newMediaName) {
                                        setNewMediaName(file.name.replace(/\.[^/.]+$/, ""));
                                      }
                                      
                                      try {
                                        const finalUrl = await uploadVideo(file);
                                        setNewMediaUrl(finalUrl);
                                        triggerAlert(`Cinematic video uploaded and saved successfully!`);
                                      } catch (err: any) {
                                        console.error("!!! MEDIA UPLOAD PIPELINE ERROR !!!", err);
                                        triggerAlert(`Connection error during asset upload: ${err.message || err}`);
                                      } finally {
                                        setIsUploading(false);
                                        setUploadStatus('');
                                      }
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>

                          {/* Direct URL Link Input */}
                          <div className="space-y-1">
                            <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-widest block">Or paste direct source URL link:</span>
                            <input
                              type="text"
                              placeholder="https://commondatastorage.googleapis.com/...mp4"
                              value={newMediaUrl}
                              onChange={(e) => setNewMediaUrl(e.target.value)}
                              className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-neutral-700 font-mono focus:border-[#d16126] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-white/5">
                          <button
                            onClick={() => {
                              if (newMediaName && newMediaUrl) {
                                addMediaAsset({
                                  title: newMediaName,
                                  videoUrl: newMediaUrl.trim(),
                                  description: newMediaDescription,
                                  category: newMediaCategory,
                                  featured: newMediaFeatured,
                                  badgeLabel: newMediaBadge,
                                  eventDate: newMediaDate,
                                  displayOrder: newMediaDisplayOrder,
                                  posterImage: newMediaPosterImage,
                                  status: newMediaStatus,
                                  processStage: newMediaProcessStage || undefined
                                });
                                // Reset forms
                                if (tempPreviewUrl) {
                                  try {
                                    URL.revokeObjectURL(tempPreviewUrl);
                                  } catch (err) {}
                                  setTempPreviewUrl('');
                                }
                                setNewMediaName('');
                                setNewMediaUrl('');
                                setNewMediaDescription('');
                                setNewMediaCategory('');
                                setNewMediaFeatured(false);
                                setNewMediaBadge('');
                                setNewMediaDate('');
                                setNewMediaDisplayOrder(0);
                                setNewMediaPosterImage('');
                                setNewMediaStatus('Active');
                                setNewMediaProcessStage('');
                                triggerAlert('New cinematic event media registered and archived successfully in global state.');
                              } else {
                                triggerAlert('Error: Video Title and Video URL are required.');
                              }
                            }}
                            className="px-5 py-2.5 bg-[#d16126] text-white rounded-xl hover:bg-[#b04a18] text-[10px] uppercase font-mono tracking-widest cursor-pointer font-bold transition-all"
                          >
                            + Archive Cinematic Video
                          </button>
                        </div>
                      </div>

                      {/* Search header list */}
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-3">
                          <div className="space-y-0.5">
                            <h4 className="text-lg font-serif text-white">Active Cinematic Media Archives</h4>
                            <p className="text-[11px] text-neutral-400 font-sans">Click edit directly on any video card below to update details inline.</p>
                          </div>
                          
                          <div className="relative w-full max-w-xs">
                            <span className="absolute inset-y-0 left-3 flex items-center text-neutral-500 font-sans">
                              <Search className="w-3.5 h-3.5" />
                            </span>
                            <input
                              type="text"
                              placeholder="Search raw archives by title..."
                              value={mediaSearch}
                              onChange={(e) => setMediaSearch(e.target.value)}
                              className="pl-9 pr-4 py-2 bg-[#14110f] border border-white/10 rounded-xl text-xs text-white focus:outline-none w-full font-sans"
                            />
                          </div>
                        </div>

                        {/* Cards collection of Media Archives */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {(state.mediaAssets || [])
                            .filter(asset => asset.title?.toLowerCase().includes(mediaSearch.toLowerCase()))
                            .map((asset) => {
                              const isEditing = editingMediaId === asset.id;

                              return (
                                <div 
                                  key={asset.id} 
                                  className="p-4 bg-[#14110f] border border-white/5 rounded-2xl text-left space-y-4 relative group flex flex-col justify-between"
                                >
                                  {isEditing ? (
                                    /* Inline Editor Form */
                                    <div className="space-y-3.5 text-xs w-full font-sans">
                                      <div className="flex items-center justify-between border-b border-white/5 pb-1">
                                        <span className="text-[10px] font-mono text-brand-gold uppercase font-bold">Edit Media: {asset.title}</span>
                                        <button
                                          onClick={() => {
                                            setEditingMediaId(null);
                                          }}
                                          className="text-neutral-400 hover:text-white"
                                        >
                                          Cancel
                                        </button>
                                      </div>

                                      <div className="space-y-2">
                                        <div className="flex flex-col gap-1">
                                          <label className="text-[9px] font-mono text-neutral-400 uppercase">Title *</label>
                                          <input
                                            type="text"
                                            value={editingMediaTitle}
                                            onChange={(e) => setEditingMediaTitle(e.target.value)}
                                            className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white font-sans"
                                          />
                                        </div>

                                        <div className="flex flex-col gap-1">
                                          <label className="text-[9px] font-mono text-neutral-400 uppercase">Category Assignment *</label>
                                          <select
                                            value={editingMediaCategory}
                                            onChange={(e) => setEditingMediaCategory(e.target.value)}
                                            className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white"
                                          >
                                            <option value="">-- No Category --</option>
                                            {state.eventCategories.map(cat => (
                                              <option key={cat.id} value={cat.id}>{cat.title}</option>
                                            ))}
                                          </select>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                          <label className="text-[9px] font-mono text-neutral-400 uppercase">Description</label>
                                          <textarea
                                            value={editingMediaDescription}
                                            onChange={(e) => setEditingMediaDescription(e.target.value)}
                                            className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white h-14 resize-none font-sans"
                                          />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-mono text-neutral-400 uppercase">Badge Label</label>
                                            <input
                                              type="text"
                                              value={editingMediaBadge}
                                              onChange={(e) => setEditingMediaBadge(e.target.value)}
                                              className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white font-sans"
                                            />
                                          </div>
                                          <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-mono text-neutral-400 uppercase">Event Date</label>
                                            <input
                                              type="text"
                                              value={editingMediaDate}
                                              onChange={(e) => setEditingMediaDate(e.target.value)}
                                              className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white font-sans"
                                            />
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                          <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-mono text-neutral-400 uppercase">Display Order</label>
                                            <input
                                              type="number"
                                              value={editingMediaDisplayOrder}
                                              onChange={(e) => setEditingMediaDisplayOrder(Number(e.target.value))}
                                              className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white"
                                            />
                                          </div>
                                          <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-mono text-neutral-400 uppercase">Visibility Status</label>
                                            <select
                                              value={editingMediaStatus}
                                              onChange={(e) => setEditingMediaStatus(e.target.value as 'Active' | 'Hidden')}
                                              className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white"
                                            >
                                              <option value="Active">Active</option>
                                              <option value="Hidden">Hidden</option>
                                            </select>
                                          </div>
                                          <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-mono text-neutral-400 uppercase">Process Stage</label>
                                            <select
                                              value={editingMediaProcessStage || ''}
                                              onChange={(e) => setEditingMediaProcessStage(e.target.value as any)}
                                              className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white"
                                            >
                                              <option value="">None / Standard</option>
                                              <option value="Vision">Vision</option>
                                              <option value="Blueprint">Blueprint</option>
                                              <option value="Build">Build</option>
                                              <option value="Moment">Moment</option>
                                              <option value="Legacy">Legacy</option>
                                            </select>
                                          </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                          <label className="text-[9px] font-mono text-neutral-400 uppercase">Video URL *</label>
                                          <input
                                            type="text"
                                            value={editingMediaVideoUrl}
                                            onChange={(e) => setEditingMediaVideoUrl(e.target.value)}
                                            className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white font-mono"
                                          />
                                        </div>

                                        <div className="flex flex-col gap-1">
                                          <label className="text-[9px] font-mono text-neutral-400 uppercase">Poster Image URL (Thumbnail)</label>
                                          <input
                                            type="text"
                                            value={editingMediaPosterImage}
                                            onChange={(e) => setEditingMediaPosterImage(e.target.value)}
                                            className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white"
                                          />
                                        </div>

                                        <div className="flex items-center gap-2 py-1">
                                          <input
                                            type="checkbox"
                                            id={`editFeatured-${asset.id}`}
                                            checked={editingMediaFeatured}
                                            onChange={(e) => setEditingMediaFeatured(e.target.checked)}
                                            className="rounded border-white/10 accent-[#d16126]"
                                          />
                                          <label htmlFor={`editFeatured-${asset.id}`} className="text-[11px] text-neutral-300">Featured Media Item</label>
                                        </div>
                                      </div>

                                      <div className="flex gap-2 justify-end pt-2 font-sans">
                                        <button
                                          onClick={() => {
                                            if (editingMediaTitle && editingMediaVideoUrl) {
                                              updateMediaAsset(asset.id, {
                                                title: editingMediaTitle,
                                                videoUrl: editingMediaVideoUrl.trim(),
                                                description: editingMediaDescription,
                                                category: editingMediaCategory,
                                                featured: editingMediaFeatured,
                                                badgeLabel: editingMediaBadge,
                                                eventDate: editingMediaDate,
                                                displayOrder: editingMediaDisplayOrder,
                                                posterImage: editingMediaPosterImage,
                                                status: editingMediaStatus,
                                                processStage: editingMediaProcessStage || undefined
                                              });
                                              setEditingMediaId(null);
                                              triggerAlert('Cinematic media updated successfully.');
                                            } else {
                                              triggerAlert('Title and Video URL cannot be blank.');
                                            }
                                          }}
                                          className="bg-[#d16126] text-white px-3 py-1.5 rounded-lg font-bold font-mono text-[9px] uppercase tracking-wide hover:bg-[#b04a18]"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    /* Standard Display Card */
                                    <>
                                      <div className="w-full space-y-3">
                                        <div className="w-full aspect-[16/10] bg-black rounded-xl border border-white/5 overflow-hidden relative group">
                                          <video 
                                            key={resolveVideoUrl(asset.videoUrl)}
                                            src={resolveVideoUrl(asset.videoUrl) || undefined} 
                                            muted 
                                            autoPlay 
                                            loop 
                                            playsInline 
                                            preload="auto"
                                            crossOrigin="anonymous"
                                            onError={(e) => {
                                              const v = e.currentTarget;
                                              console.error("!!! ADMIN CMS ASSET VIDEO LOAD ERROR !!!", {
                                                id: asset.id,
                                                src: v.src,
                                                code: v.error?.code,
                                                message: v.error?.message,
                                                networkState: v.networkState,
                                                readyState: v.readyState
                                              });
                                            }}
                                            placeholder={asset.posterImage}
                                            className="w-full h-full object-cover" 
                                          />
                                          {/* Badges Overlay */}
                                          <div className="absolute top-2 left-2 flex flex-col gap-1.5 pointer-events-none">
                                            {asset.category && (
                                              <span className="bg-[#faf8f5]/95 backdrop-blur-md px-2 py-0.5 text-[8px] font-mono text-[#d16126] capitalize tracking-wide rounded border border-black/10 font-sans font-bold">
                                                {asset.category}
                                              </span>
                                            )}
                                            {asset.processStage && (
                                              <span className="bg-[#d16126] text-white px-2 py-0.5 text-[7px] font-mono uppercase tracking-wide rounded font-bold">
                                                Stage: {asset.processStage}
                                              </span>
                                            )}
                                            {asset.featured && (
                                              <span className="bg-amber-500/90 text-black px-2 py-0.5 text-[7px] font-mono uppercase tracking-wide rounded font-bold">
                                                Featured
                                              </span>
                                            )}
                                          </div>

                                          {/* Visibility Tag */}
                                          <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[7px] font-mono tracking-widest ${
                                            asset.status === 'Hidden' ? 'bg-red-950 text-red-350 border border-red-500/20' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/20'
                                          }`}>
                                            {asset.status || 'Active'}
                                          </span>
                                        </div>

                                        <div className="space-y-1">
                                          <h4 className="text-xs font-serif font-semibold text-white block capitalize truncate">{asset.title}</h4>
                                          
                                          {asset.description && (
                                            <p className="text-[10px] text-neutral-400 line-clamp-2 font-light leading-relaxed font-sans">{asset.description}</p>
                                          )}

                                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono text-[8px] text-neutral-500 pt-1 border-t border-white/5">
                                            {asset.badgeLabel && (
                                              <span className="bg-white/5 border border-white/5 px-1.5 py-0.5 rounded text-neutral-300 font-sans">{asset.badgeLabel}</span>
                                            )}
                                            {asset.eventDate && (
                                              <span className="text-neutral-400 font-medium font-sans">📅 {asset.eventDate}</span>
                                            )}
                                            {asset.displayOrder !== undefined && (
                                              <span className="text-neutral-400 font-sans">Order: {asset.displayOrder}</span>
                                            )}
                                          </div>
                                          <span className="text-[7px] font-mono text-neutral-600 block truncate leading-tight select-all pt-1">{asset.videoUrl}</span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                        <button
                                          onClick={() => {
                                            setEditingMediaId(asset.id);
                                            setEditingMediaTitle(asset.title || '');
                                            setEditingMediaVideoUrl(asset.videoUrl || '');
                                            setEditingMediaDescription(asset.description || '');
                                            setEditingMediaCategory(asset.category || '');
                                            setEditingMediaFeatured(asset.featured || false);
                                            setEditingMediaBadge(asset.badgeLabel || '');
                                            setEditingMediaDate(asset.eventDate || '');
                                            setEditingMediaDisplayOrder(asset.displayOrder || 0);
                                            setEditingMediaPosterImage(asset.posterImage || '');
                                            setEditingMediaStatus(asset.status || 'Active');
                                            setEditingMediaProcessStage(asset.processStage || '');
                                          }}
                                          className="bg-white/5 border border-white/10 text-white rounded-lg px-2.5 py-1.5 hover:bg-white/10 text-[9px] uppercase font-mono tracking-wider flex-1 text-center font-bold"
                                        >
                                          Edit
                                        </button>
                                        
                                        <button
                                          onClick={() => {
                                            triggerConfirm(
                                              `Permanently delete cinematic asset "${asset.title}" from archives?`,
                                              () => { deleteMediaAsset(asset.id); }
                                            );
                                          }}
                                          className="p-1 px-2.5 bg-red-950/40 hover:bg-red-955 border border-red-500/25 rounded-lg text-red-300 cursor-pointer text-center"
                                          title="Delete"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Categories Management Panel (lg:col-span-4) */}
                    <div className="lg:col-span-4 bg-[#14110f] border border-white/5 rounded-2xl p-6 space-y-6">
                      <div className="border-b border-white/5 pb-2">
                        <h3 className="text-sm font-mono uppercase tracking-wider text-[#d16126] font-bold">
                          Categories Panel
                        </h3>
                        <p className="text-[10px] text-neutral-400 font-sans mt-0.5">Define custom service categories. Each visible category dynamically generates a scrolling scene in the Services experience!</p>
                      </div>

                      {/* Create/Edit Category Form */}
                      <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-3.5 text-xs">
                        <h4 className="text-[10px] font-mono uppercase tracking-wider text-white font-bold">
                          {editingCategoryId ? `⚙️ Edit Category: ${catFormId}` : `+ Create Custom Category`}
                        </h4>

                        <div className="space-y-2.5">
                          {!editingCategoryId && (
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold">Category ID / Slug *</label>
                              <input
                                type="text"
                                placeholder="e.g. fashion-shows (lowercase, no spaces)"
                                value={catFormId}
                                onChange={(e) => setCatFormId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder:text-neutral-700 font-mono"
                              />
                            </div>
                          )}

                          <div className="flex flex-col gap-1 font-sans">
                            <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold">Category Name Title *</label>
                            <input
                              type="text"
                              placeholder="e.g. High-Fashion Runway"
                              value={catFormTitle}
                              onChange={(e) => setCatFormTitle(e.target.value)}
                              className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder:text-neutral-600"
                            />
                          </div>

                          <div className="flex flex-col gap-1 font-sans">
                            <label className="text-[9px] font-mono text-neutral-400 uppercase">Short Subtext / Tagline</label>
                            <input
                              type="text"
                              placeholder="e.g. Elite runway curation and venue mapping."
                              value={catFormSubtext}
                              onChange={(e) => setCatFormSubtext(e.target.value)}
                              className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder:text-neutral-600"
                            />
                          </div>

                          <div className="flex flex-col gap-1 font-sans">
                            <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold">Services Description *</label>
                            <textarea
                              placeholder="Write a rich narrative describing your expertise, deliverables, and customized timelines for this category..."
                              value={catFormDescription}
                              onChange={(e) => setCatFormDescription(e.target.value)}
                              className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder:text-neutral-600 h-20 resize-none font-sans"
                            />
                          </div>

                          <div className="flex flex-col gap-1 font-sans">
                            <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold">Badge Label (e.g. EXQUISITE RUNWAY)</label>
                            <input
                              type="text"
                              placeholder="e.g. BESPOKE RUNWAYS"
                              value={catFormBadge}
                              onChange={(e) => setCatFormBadge(e.target.value)}
                              className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold">Cover Video URL *</label>
                            <input
                              type="text"
                              placeholder="https://commondatastorage.googleapis.com/...mp4"
                              value={catFormCoverVideo}
                              onChange={(e) => setCatFormCoverVideo(e.target.value)}
                              className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono placeholder:text-neutral-700"
                            />
                          </div>

                          <div className="flex flex-col gap-1 font-sans">
                            <label className="text-[9px] font-mono text-neutral-400 uppercase">Fallback Cover Image URL</label>
                            <input
                              type="text"
                              placeholder="https://images.unsplash.com/..."
                              value={catFormCoverImage}
                              onChange={(e) => setCatFormCoverImage(e.target.value)}
                              className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder:text-neutral-700"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-mono text-neutral-400 uppercase">Display Order</label>
                              <input
                                type="number"
                                value={catFormOrder}
                                onChange={(e) => setCatFormOrder(Number(e.target.value))}
                                className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-white font-sans"
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-4 pl-1 font-sans">
                              <input
                                type="checkbox"
                                id="catFormVisible"
                                checked={catFormVisible}
                                onChange={(e) => setCatFormVisible(e.target.checked)}
                                className="rounded border-white/10 accent-[#d16126]"
                              />
                              <label htmlFor="catFormVisible" className="text-[10px] text-neutral-300">Visible on Site</label>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-2 border-t border-white/5 font-sans">
                          {editingCategoryId && (
                            <button
                              onClick={() => {
                                setEditingCategoryId(null);
                                setCatFormId('');
                                setCatFormTitle('');
                                setCatFormSubtext('');
                                setCatFormDescription('');
                                setCatFormCoverVideo('');
                                setCatFormCoverImage('');
                                setCatFormVisible(true);
                                setCatFormOrder(0);
                                setCatFormBadge('');
                              }}
                              className="bg-white/5 text-neutral-400 px-3 py-1.5 rounded-lg text-[9px] uppercase font-mono tracking-wide"
                            >
                              Clear
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (editingCategoryId) {
                                updateCategory(editingCategoryId, {
                                  title: catFormTitle,
                                  subtext: catFormSubtext,
                                  description: catFormDescription,
                                  coverVideo: catFormCoverVideo,
                                  coverImage: catFormCoverImage,
                                  visible: catFormVisible,
                                  order: catFormOrder,
                                  badge: catFormBadge,
                                  image: catFormCoverImage || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800'
                                });
                                setEditingCategoryId(null);
                                setCatFormId('');
                                setCatFormTitle('');
                                setCatFormSubtext('');
                                setCatFormDescription('');
                                setCatFormCoverVideo('');
                                setCatFormCoverImage('');
                                setCatFormVisible(true);
                                setCatFormOrder(0);
                                setCatFormBadge('');
                                triggerAlert('Event category updated successfully.');
                              } else {
                                if (catFormId && catFormTitle) {
                                  addCategory({
                                    id: catFormId,
                                    title: catFormTitle,
                                    subtext: catFormSubtext || 'Custom coordinator planning.',
                                    tagline: 'BESPOKE COORDINATION MODEL',
                                    image: catFormCoverImage || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800',
                                    accentColor: 'text-brand-gold border-brand-gold',
                                    bgOverlay: 'bg-black/35',
                                    textColor: '#d16126',
                                    description: catFormDescription,
                                    coverVideo: catFormCoverVideo,
                                    coverImage: catFormCoverImage,
                                    visible: catFormVisible,
                                    order: catFormOrder,
                                    badge: catFormBadge
                                  });
                                  setCatFormId('');
                                  setCatFormTitle('');
                                  setCatFormSubtext('');
                                  setCatFormDescription('');
                                  setCatFormCoverVideo('');
                                  setCatFormCoverImage('');
                                  setCatFormVisible(true);
                                  setCatFormOrder(0);
                                  setCatFormBadge('');
                                  triggerAlert(`Category event type registered successfully.`);
                                } else {
                                  triggerAlert('Error: Category ID/Slug and Title Name are required.');
                                }
                              }
                            }}
                            className="bg-[#d16126] text-white px-4 py-1.5 rounded-lg font-bold font-mono text-[9px] uppercase tracking-wide hover:bg-[#b04a18]"
                          >
                            {editingCategoryId ? 'Save category' : '+ Add Category'}
                          </button>
                        </div>
                      </div>

                      {/* Category List */}
                      <div className="space-y-3 font-sans">
                        <h4 className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold border-b border-white/5 pb-1">
                          Registered Categories ({state.eventCategories.length})
                        </h4>

                        <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                          {state.eventCategories.map((cat) => {
                            const count = (state.mediaAssets || []).filter(m => m.category === cat.id).length;
                            return (
                              <div key={cat.id} className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-start justify-between text-xs transition-colors hover:border-white/10 font-sans">
                                <div className="space-y-1 max-w-[70%]">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-serif font-bold text-white text-xs">{cat.title}</span>
                                    <span className="text-[8px] font-mono bg-white/5 px-1 rounded text-neutral-405 font-bold">{cat.id}</span>
                                    {cat.visible === false && (
                                      <span className="text-[7px] font-mono bg-red-950 text-red-400 px-1 rounded uppercase tracking-wider">Hidden</span>
                                    )}
                                  </div>
                                  {cat.description ? (
                                    <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed font-sans">{cat.description}</p>
                                  ) : (
                                    <p className="text-[10px] text-neutral-500 italic font-sans">No custom story description written.</p>
                                  )}
                                  <div className="text-[8px] font-mono text-[#d16126] flex items-center gap-2">
                                    <span>🎥 {count} associated video{count !== 1 ? 's' : ''}</span>
                                    {cat.order !== undefined && <span>Order: {cat.order}</span>}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingCategoryId(cat.id);
                                      setCatFormId(cat.id);
                                      setCatFormTitle(cat.title || '');
                                      setCatFormSubtext(cat.subtext || '');
                                      setCatFormDescription(cat.description || '');
                                      setCatFormCoverVideo(cat.coverVideo || '');
                                      setCatFormCoverImage(cat.coverImage || '');
                                      setCatFormVisible(cat.visible !== false);
                                      setCatFormOrder(cat.order || 0);
                                      setCatFormBadge(cat.badge || '');
                                    }}
                                    className="p-1 text-neutral-300 hover:text-white"
                                    title="Edit Category"
                                  >
                                    ⚙️
                                  </button>
                                  <button
                                    onClick={() => {
                                      triggerConfirm(
                                        `Delete custom category "${cat.title}"? Associated videos in the media archives will remain but lose category references.`,
                                        () => { deleteCategory(cat.id); }
                                      );
                                    }}
                                    className="p-1 text-red-500 hover:text-red-400"
                                    title="Delete Category"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* TAB: DATABASE CONFIGURATION & REINTEGRATION PANEL */}
              {activeTab === 'database' && (
                <div className="space-y-8 animate-fade-in text-neutral-200 text-left">
                  <div>
                    <h2 className="text-4xl font-serif text-white tracking-wide">Local SQLite Database Center</h2>
                    <p className="text-neutral-400 text-xs mt-1.5 font-sans">
                      Monitor and manage your active physical records, event inquiries, and CMS website states inside the local <code>kbl.db</code> SQLite database store.
                    </p>
                  </div>

                  {/* Connection Verification and State Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* LEFT PANEL: Diagnostic Indicators & Sync Controls */}
                    <div className="lg:col-span-5 space-y-6">
                      
                      {/* 1. CONFIGURATION PATH CARD */}
                      <div className="p-6 bg-[#14110f] border border-white/5 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-mono text-[#d16126] font-bold uppercase tracking-widest">Database Registry</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                            ● ACTIVE & DURABLE
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
                          Your records store locally on the persistent container disk. Highly secure, zero-latency transactions managed by <code>better-sqlite3</code> in <strong>WAL (Write-Ahead Logging)</strong> mode.
                        </p>

                        <div className="p-3.5 bg-[#0d0a08] border border-white/5 rounded-xl text-[10px] font-mono space-y-2 text-neutral-400">
                          <div>
                            <span className="text-neutral-500 block text-[9px] uppercase font-bold tracking-wider">Database Engine</span>
                            <span className="text-neutral-300">better-sqlite3</span>
                          </div>
                          <div className="pt-1.5 border-t border-white/5">
                            <span className="text-neutral-500 block text-[9px] uppercase font-bold tracking-wider">Storage File</span>
                            <span className="break-all text-neutral-300">/kbl.db</span>
                          </div>
                        </div>
                      </div>

                      {/* 2. DIAGNOSTIC CONNECTION TESTER */}
                      <div className="p-6 bg-[#14110f] border border-white/5 rounded-3xl space-y-4">
                        <h3 className="text-xs font-mono text-[#d16126] font-bold uppercase tracking-widest">Active Connection Integrity</h3>
                        
                        <div className="flex gap-3">
                          <button
                            onClick={async () => {
                              setDbTestStatus('checking');
                              setDbTestMessage('Initiating health check call to local Express endpoints...');
                              try {
                                const res = await testSupabaseConnection();
                                if (res.success) {
                                  setDbTestStatus('success');
                                  setDbTestMessage(res.message);
                                  setDbTestCode(res.code);
                                } else {
                                  setDbTestStatus('failed');
                                  setDbTestMessage(res.message);
                                  setDbTestCode(res.code);
                                }
                              } catch (err: any) {
                                setDbTestStatus('failed');
                                setDbTestMessage(`Local connection failed: ${err.message || err}`);
                              }
                            }}
                            disabled={dbTestStatus === 'checking'}
                            className="flex-1 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl text-[10px] font-mono uppercase tracking-widest text-center transition cursor-pointer font-bold select-none disabled:opacity-40"
                          >
                            {dbTestStatus === 'checking' ? 'Testing engine...' : 'Diagnose Database'}
                          </button>
                          
                          {dbTestStatus !== 'idle' && (
                            <button
                              onClick={() => {
                                setDbTestStatus('idle');
                                setDbTestMessage('');
                                setDbTestCode(undefined);
                              }}
                              className="px-3 py-2.5 bg-transparent text-neutral-500 hover:text-white hover:bg-white/5 border border-white/5 rounded-xl transition cursor-pointer"
                              title="Reset State"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {dbTestStatus !== 'idle' && (
                          <div className={`p-4 rounded-xl border text-xs text-left font-sans space-y-2 ${
                            dbTestStatus === 'success'
                              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                              : 'bg-red-500/5 border-red-500/20 text-red-300'
                          }`}>
                            <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold tracking-wider">
                              <span className={`w-2 h-2 rounded-full animate-ping ${
                                dbTestStatus === 'success' ? 'bg-emerald-400' : 'bg-red-400'
                              }`} />
                              <span>
                                {dbTestStatus === 'checking' ? 'Testing...' : dbTestStatus === 'success' ? 'Diagnostics Checked' : 'Verification Failed'}
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed">{dbTestMessage}</p>
                          </div>
                        )}
                      </div>

                      {/* 3. HARD MANUAL FORCED OVERRIDE SYNC */}
                      <div className="p-6 bg-[#14110f] border border-white/5 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-mono text-[#d16126] font-bold uppercase tracking-widest">Manual SQLite Override</h3>
                          {syncStatus === 'syncing' && (
                            <span className="text-[10px] font-mono text-blue-400 animate-pulse uppercase">
                              Syncing in action...
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
                          Force synchronizes entire local client dataset (drafts, published states, inquiries, media items) to the <code>kbl.db</code> file. Perfect for restoring database entries from cache.
                        </p>

                        <button
                          onClick={async () => {
                            triggerConfirm(
                              "WARNING: Trigerring fully forced database sync will overwrite existing records in kbl.db with this client's current memory configuration. Continue?",
                              async () => {
                                setSyncStatus('syncing');
                                setSyncLogs([]);
                                
                                const addLog = (msg: string) => {
                                  setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
                                };

                                addLog('Initializing local database synchronization process...');
                                
                                try {
                                  const { syncCMSStateToSupabase, syncInquiryToSupabase, syncMediaAssetToSupabase } = await import('../lib/supabaseClient');
                                  
                                  addLog('Syncing Website Configuration schema (Draft ID: "draft")...');
                                  const r1 = await syncCMSStateToSupabase('draft', state);
                                  addLog(r1 ? 'Draft state synchronized with remote kbl.db.' : 'Warning: Draft sync returned false.');

                                  addLog('Syncing Website Configuration schema (Published ID: "published")...');
                                  const r2 = await syncCMSStateToSupabase('published', publishedState);
                                  addLog(r2 ? 'Published state synchronized.' : 'Warning: Published sync returned false.');

                                  addLog(`Scanning ${state.mediaAssets?.length || 0} Cinematic assets...`);
                                  let assetsSuccessCount = 0;
                                  if (state.mediaAssets && state.mediaAssets.length > 0) {
                                    for (const asset of state.mediaAssets) {
                                      const r = await syncMediaAssetToSupabase(asset);
                                      if (r) assetsSuccessCount++;
                                    }
                                    addLog(`Cinematic media assets complete. (${assetsSuccessCount}/${state.mediaAssets.length} saved)`);
                                  } else {
                                    addLog('No Cinematic assets found.');
                                  }

                                  addLog(`Scanning ${state.inquiries?.length || 0} client inquiries...`);
                                  let inquiriesSuccessCount = 0;
                                  if (state.inquiries && state.inquiries.length > 0) {
                                    for (const inq of state.inquiries) {
                                      const r = await syncInquiryToSupabase(inq);
                                      if (r) inquiriesSuccessCount++;
                                    }
                                    addLog(`Client inquiry items complete. (${inquiriesSuccessCount}/${state.inquiries.length} saved)`);
                                  } else {
                                    addLog('No inquiries found.');
                                  }

                                  setSyncStatus('success');
                                  addLog('LOCAL SUCCESS: Synchronization process completed flawlessly inside kbl.db.');
                                  triggerAlert('SQLite database synchronized perfectly!');
                                } catch (err: any) {
                                  console.error(err);
                                  setSyncStatus('failed');
                                  addLog(`FATAL SYNC EXCEPTION: ${err.message || err}`);
                                  triggerAlert('Database synchronization failed.');
                                }
                              }
                            );
                          }}
                          disabled={syncStatus === 'syncing'}
                          className="w-full py-3 bg-[#d16126] hover:bg-[#b04a18] disabled:opacity-40 rounded-xl text-[10px] font-mono uppercase tracking-widest text-center transition cursor-pointer font-bold select-none text-white block shadow-md hover:shadow-lg"
                        >
                          Overwrite Local Database File
                        </button>

                        {/* SYNC LOGS TERMINAL BOX */}
                        {(syncLogs.length > 0 || syncStatus === 'syncing') && (
                          <div className="space-y-2 mt-4">
                            <span className="text-[10px] font-mono text-neutral-400 block pb-1 border-b border-white/5 uppercase font-medium">Overwriting stream telemetry:</span>
                            <div className="p-4 bg-[#0d0a08] border border-white/10 rounded-2xl h-48 overflow-y-auto font-mono text-[9px] text-neutral-400 space-y-1.5 scrollbar-thin">
                              {syncLogs.map((log, index) => {
                                const isSuccess = log.includes('LOCAL SUCCESS') || log.includes('successfully') || log.includes('complete');
                                const isWarn = log.includes('Warning') || log.includes('WARNING');
                                return (
                                  <div key={index} className={isSuccess ? 'text-emerald-400' : isWarn ? 'text-amber-400' : 'text-neutral-300'}>
                                    {log}
                                  </div>
                                );
                              })}
                              {syncStatus === 'syncing' && (
                                <div className="text-[#d16126] animate-pulse flex items-center gap-1.5">
                                  <span>[WAITING] Processing transaction queries...</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>


                    {/* RIGHT PANEL: SQL SHEMA MASTER CREATION CODES */}
                    <div className="lg:col-span-7 p-6 bg-[#14110f] border border-white/5 rounded-3xl space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <div>
                          <h3 className="text-xs font-mono text-[#d16126] font-bold uppercase tracking-widest">SQLite Database DDL Schema</h3>
                          <p className="text-[11px] text-neutral-500 font-normal font-sans mt-0.5">Physical tables schema definitions constructed within your kbl.db active container storage.</p>
                        </div>
                        <button
                          onClick={() => {
                            const codeStr = document.getElementById('sql-schema-editor-source')?.innerText;
                            if (codeStr && navigator.clipboard) {
                              navigator.clipboard.writeText(codeStr);
                              triggerAlert("SQLite DDL Schema copied to clipboard.");
                            } else {
                              triggerAlert("Press Ctrl+C (Cmd+C) over the code block below to copy.");
                            }
                          }}
                          className="px-3.5 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] text-[9.5px] font-mono border border-white/10 rounded-lg text-white font-medium cursor-pointer uppercase transition"
                        >
                          Copy Schema
                        </button>
                      </div>

                      <div className="relative group">
                        <pre 
                          id="sql-schema-editor-source"
                          className="overflow-x-auto p-5 bg-[#0d0a08] border border-white/10 rounded-2xl text-[10px] text-zinc-300 font-mono leading-relaxed h-[560px] max-h-[640px] text-left select-all focus:outline-none"
                        >
{`-- 1. CMS WEBSITE CONFIGURATION SCHEMA
CREATE TABLE IF NOT EXISTS cms_state (
  id TEXT PRIMARY KEY,
  state_data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. INTAKE INQUIRIES LOG WORKFLOW TABLE
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
  status TEXT DEFAULT 'New',
  proposal_concept TEXT,
  submitted_at TEXT NOT NULL
);

-- 3. CINEMATIC GALLERY AUDIOVISUAL ARCHIVE TABLE
CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  title TEXT,
  category TEXT,
  video_url TEXT,
  poster_image TEXT,
  featured INTEGER DEFAULT 0,
  tags TEXT, -- JSON array of strings
  event_date TEXT,
  status TEXT DEFAULT 'Active',
  process_stage TEXT,
  display_order INTEGER DEFAULT 0
);

-- Active Journal Mode: WAL (Write-Ahead Logging)
PRAGMA journal_mode = WAL;

-- Total Storage System: local kbl.db disk file`}
                        </pre>
                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* TAB 13: SENSORY PROCESS STEPS */}
              {activeTab === 'process' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-4xl font-serif text-white tracking-wide animate-fade-in">Sensory Planning Blueprint</h2>
                      <p className="text-neutral-400 text-xs mt-1.5 font-sans">Configure, edit, and orchestrate the sensory planning stages displayed to clients on the primary layout.</p>
                    </div>
                    <button
                      onClick={() => {
                        const newStep = {
                          title: 'New Event Stage',
                          narrative: 'Initiating strategic logistics and creative mapping protocols.',
                          details: 'Our senior planners orchestrate physical blueprints, schedule master runsheet contingencies, and match elite regional premium suppliers.',
                          iconName: 'Compass'
                        };
                        addProcessStep(newStep);
                        triggerAlert('New planning process stage added to the workflow index.');
                      }}
                      className="px-4 py-2 border border-[#d16126]/40 hover:bg-[#d16126]/12 text-white text-[10px] font-mono uppercase tracking-widest rounded-xl cursor-pointer font-bold"
                    >
                      + Add Process Stage
                    </button>
                  </div>

                  {/* EDITABLE SECTION HEADER */}
                  <div className="p-6 bg-[#14110f] border border-white/5 rounded-3xl space-y-4 text-left">
                    <h3 className="text-xs font-mono text-[#d16126] font-bold uppercase tracking-widest">Section Heading Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-mono text-neutral-400 block mb-1">SECTION EYEBROW</label>
                        <input
                          type="text"
                          value={state.themeConfig?.processEyebrow || 'HOW WE WORK'}
                          onChange={(e) => updateTheme({ processEyebrow: e.target.value })}
                          className="w-full bg-[#0d0a08] border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-sans focus:border-[#d16126] focus:outline-none"
                          placeholder="e.g. HOW WE WORK"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-neutral-400 block mb-1">SECTION MAIN HEADING</label>
                        <input
                          type="text"
                          value={state.themeConfig?.processTitle || 'How We Bring Events To Life'}
                          onChange={(e) => updateTheme({ processTitle: e.target.value })}
                          className="w-full bg-[#0d0a08] border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-serif focus:border-[#d16126] focus:outline-none"
                          placeholder="e.g. How We Bring Events To Life"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-neutral-400 block mb-1">SECTION DESCRIPTION SUPPORTING TEXT</label>
                      <textarea
                        value={state.themeConfig?.processDescription || ''}
                        onChange={(e) => updateTheme({ processDescription: e.target.value })}
                        className="w-full bg-[#0d0a08] border border-white/10 rounded-lg px-3 py-2 text-white text-xs resize-none focus:border-[#d16126] focus:outline-none animate-fade-in"
                        rows={2}
                        placeholder="CMS-editable supporting description text..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12 animate-fade-in">
                    {(state.processSteps || []).map((step, index) => {
                      const isEditing = editingProcessIdx === index;
                      return (
                        <div key={index} className="p-5 bg-[#14110f] border border-white/5 rounded-3xl space-y-4 text-left relative group">
                          {/* Top Tag indicator */}
                          <div className="flex justify-between items-center pb-2 border-b border-white/5">
                            <span className="text-xs font-mono text-[#d16126] font-bold uppercase tracking-widest">Stage {step.number}</span>
                            
                            <div className="flex items-center gap-1.5">
                              {/* Reorder Buttons */}
                              <button
                                onClick={() => {
                                  if (index > 0) {
                                    const copy = [...(state.processSteps || [])];
                                    const temp = copy[index - 1];
                                    copy[index - 1] = copy[index];
                                    copy[index] = temp;
                                    reorderProcessSteps(copy);
                                  }
                                }}
                                disabled={index === 0}
                                className="p-1 hover:bg-white/5 rounded disabled:opacity-20 text-neutral-400 transition-colors"
                                title="Move up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (index < (state.processSteps || []).length - 1) {
                                    const copy = [...(state.processSteps || [])];
                                    const temp = copy[index + 1];
                                    copy[index + 1] = copy[index];
                                    copy[index] = temp;
                                    reorderProcessSteps(copy);
                                  }
                                }}
                                disabled={index === (state.processSteps || []).length - 1}
                                className="p-1 hover:bg-white/5 rounded disabled:opacity-20 text-neutral-400 transition-colors"
                                title="Move down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {isEditing ? (
                              <div className="space-y-3 text-xs">
                                <div>
                                  <label className="text-[9px] font-mono text-neutral-400 block mb-1">STAGE TITLE</label>
                                  <input
                                    type="text"
                                    value={step.title}
                                    onChange={(e) => updateProcessStep(index, { title: e.target.value })}
                                    className="w-full bg-[#0d0a08] border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs font-serif focus:border-[#d16126] focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-mono text-neutral-400 block mb-1">SHORT NARRATIVE</label>
                                  <input
                                    type="text"
                                    value={step.narrative}
                                    onChange={(e) => updateProcessStep(index, { narrative: e.target.value })}
                                    className="w-full bg-[#0d0a08] border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-[#d16126] focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-mono text-neutral-400 block mb-1">EXTENDED DETAILS DESCRIPTION</label>
                                  <textarea
                                    value={step.details || ''}
                                    onChange={(e) => updateProcessStep(index, { details: e.target.value })}
                                    className="w-full bg-[#0d0a08] border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs resize-none focus:border-[#d16126] focus:outline-none"
                                    rows={4}
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-mono text-neutral-400 block mb-1">SELECT STAGE ICON</label>
                                  <select
                                    value={step.iconName || 'Compass'}
                                    onChange={(e) => updateProcessStep(index, { iconName: e.target.value })}
                                    className="w-full bg-[#0d0a08] border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-[#d16126] focus:outline-none"
                                  >
                                    <option value="Compass">Compass (Discovery)</option>
                                    <option value="Map">Map (Strategy)</option>
                                    <option value="Sparkles">Sparkles (Design)</option>
                                    <option value="Users">Users (Coordination)</option>
                                    <option value="Activity">Activity / Heartbeat (Event Day)</option>
                                    <option value="Award">Award (Legacy)</option>
                                    <option value="Wine">Wine Glass (Milestone) </option>
                                    <option value="Layers">Layers (Multilayered)</option>
                                    <option value="Calendar">Calendar (Planning)</option>
                                    <option value="Clock">Clock (Timeline)</option>
                                  </select>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">
                                    {step.iconName === 'Compass' && '🧭'}
                                    {step.iconName === 'Map' && '🗺️'}
                                    {step.iconName === 'Sparkles' && '✨'}
                                    {step.iconName === 'Users' && '👥'}
                                    {step.iconName === 'Activity' && '⚡'}
                                    {step.iconName === 'Award' && '🏆'}
                                    {step.iconName === 'Wine' && '🍷'}
                                    {step.iconName === 'Layers' && '🥞'}
                                    {step.iconName === 'Calendar' && '📅'}
                                    {step.iconName === 'Clock' && '🕒'}
                                    {!step.iconName && '✨'}
                                  </span>
                                  <h3 className="text-lg font-serif text-white font-medium">{step.title}</h3>
                                </div>
                                <p className="text-xs font-mono text-neutral-400 leading-relaxed italic">"{step.narrative}"</p>
                                <p className="text-[11px] text-neutral-300 font-light leading-relaxed pt-1">{step.details}</p>
                              </div>
                            )}

                            <div className="flex justify-between items-center border-t border-white/5 pt-3">
                              <button
                                onClick={() => setEditingProcessIdx(isEditing ? null : index)}
                                className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider hover:text-white cursor-pointer font-bold"
                              >
                                {isEditing ? 'Save Blueprint' : 'Modify Stage Details'}
                              </button>

                              <button
                                onClick={() => {
                                  triggerConfirm(
                                    `Remove Stage "${step.title}" from sensory blueprint? This will auto-adjust step order.`,
                                    () => {
                                      deleteProcessStep(index);
                                      setEditingProcessIdx(null);
                                    }
                                  );
                                }}
                                className="text-red-400 hover:text-red-500 cursor-pointer"
                                title="Delete stage"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {(state.processSteps || []).length === 0 && (
                      <div className="col-span-full h-40 flex flex-col justify-center items-center text-center text-neutral-500 border border-white/5 rounded-3xl">
                        <Cpu className="w-8 h-8 text-neutral-600 mb-2" />
                        <p className="text-xs font-mono lowercase">no configured process stages found.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Quick instructions panel inside Workspace */}
          <footer className="mt-12 pt-6 border-t border-white/5 text-left text-neutral-500 text-[10px] font-mono leading-relaxed space-y-1 block uppercase tracking-wider">
            <span>&copy; 2026 Gather Creative Studio Inc. &middot; Fully authorized client-side registry system.</span>
            <span className="block text-[#d16126] font-bold">* Changes are simulated immediately in the draft preview panel.</span>
          </footer>
        </main>
      </div>

      {/* EXQUISITE BESPOKE DIALOG OVERLAY */}
      <AnimatePresence>
        {dialogState.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="w-full max-w-md bg-[#14110f] border border-white/10 p-6 rounded-3xl space-y-4 shadow-2xl relative text-left"
            >
              <div className="space-y-1.55">
                <span className="text-[10px] font-mono tracking-widest text-[#d16126] uppercase font-bold block">
                  System Notification
                </span>
                <p className="text-xs sm:text-xs font-sans text-neutral-300 leading-relaxed">
                  {dialogState.message}
                </p>
              </div>

              {dialogState.type === 'prompt' && (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={dialogState.promptValue || ''}
                    onChange={(e) => setDialogState(prev => ({ ...prev, promptValue: e.target.value }))}
                    className="w-full bg-[#0d0a08] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono focus:border-[#d16126] focus:outline-none"
                    autoFocus
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                {dialogState.type !== 'alert' && (
                  <button
                    onClick={() => {
                      setDialogState(prev => ({ ...prev, isOpen: false }));
                      if (dialogState.onCancel) dialogState.onCancel();
                    }}
                    className="px-4 py-2 bg-transparent hover:bg-white/5 border border-white/10 text-neutral-400 hover:text-white rounded-xl text-[10px] font-mono uppercase tracking-widest transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                
                <button
                  onClick={() => {
                    if (dialogState.type === 'prompt') {
                      if (dialogState.onConfirm) dialogState.onConfirm(dialogState.promptValue);
                    } else {
                      if (dialogState.onConfirm) dialogState.onConfirm();
                    }
                  }}
                  className="px-5 py-2 bg-[#d16126] text-white hover:bg-[#b04a18] rounded-xl text-[10px] font-mono uppercase tracking-widest transition cursor-pointer font-bold"
                >
                  {dialogState.type === 'confirm' ? 'Confirm' : 'OK'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
