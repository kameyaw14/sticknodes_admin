// src/pages/Top10Manager.jsx ← FINAL VERSION NIGGA — PUBLISH FIXED, BACK BUTTON, LOADING, TOASTS, EVERYTHING
import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Plus, ExternalLink, Calendar, ArrowUp, ArrowDown, X, GripVertical, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import axios from 'axios';
import { useAppContext } from '../contexts/AppContext';
import AddVideoModal from '../components/top10/AddVideoModal';
import CreateWeekModal from '../components/top10/CreateWeekModal';

const Top10Manager = () => {
  const { BASE_URL, accessToken } = useAppContext();
  const [weeks, setWeeks] = useState([]);
  const [activeWeek, setActiveWeek] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false); // NEW: For publish, reorder, etc.
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateWeekOpen, setIsCreateWeekOpen] = useState(false);
  const [useDragDrop, setUseDragDrop] = useState(true);

  // NEW: Back to week selection
  const goBackToWeeks = () => {
    setSelectedWeek(null);
    toast.info("Back to all weeks");
  };

  const fetchWeeks = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${BASE_URL}admin/top10`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setWeeks(res.data.pastWeeks || []);
      setActiveWeek(res.data.activeWeek);
      setSelectedWeek(res.data.activeWeek || res.data.pastWeeks?.[0] || null);
    } catch (err) {
      toast.error("Failed to load Top 10 weeks — server sleeping?");
    } finally {
      setIsLoading(false);
    }
  }, [BASE_URL, accessToken]);

  useEffect(() => {
    fetchWeeks();
  }, [fetchWeeks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const onDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedWeek || actionLoading) return;

    const oldIndex = selectedWeek.videos.findIndex(v => v.video.id === active.id);
    const newIndex = selectedWeek.videos.findIndex(v => v.video.id === over.id);
    if (oldIndex === newIndex) return;

    setActionLoading(true);
    toast.loading("Saving new order...");

    const items = arrayMove(selectedWeek.videos, oldIndex, newIndex);
    const updated = { ...selectedWeek, videos: items };
    setSelectedWeek(updated);

    try {
      await axios.put(
        `${BASE_URL}admin/top10/week/${selectedWeek.id}/reorder`,
        { orderedVideoIds: items.map(v => v.video.id) },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success("Order saved — ranks locked in!");
    } catch (err) {
      toast.error("Save failed — internet died?");
      fetchWeeks();
    } finally {
      setActionLoading(false);
    }
  };

  const moveVideo = async (videoId, direction) => {
    if (actionLoading || !selectedWeek) return;
    const index = selectedWeek.videos.findIndex(v => v.video.id === videoId);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === selectedWeek.videos.length - 1)) return;

    setActionLoading(true);
    toast.loading("Moving rank...");

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const items = arrayMove(selectedWeek.videos, index, newIndex);
    const updated = { ...selectedWeek, videos: items };
    setSelectedWeek(updated);

    try {
      await axios.put(
        `${BASE_URL}admin/top10/week/${selectedWeek.id}/reorder`,
        { orderedVideoIds: items.map(v => v.video.id) },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success("Rank updated!");
    } catch (err) {
      toast.error("Move failed");
      fetchWeeks();
    } finally {
      setActionLoading(false);
    }
  };

  // FIXED: PUBLISH BUTTON NOW VISIBLE + LOADING + TOAST
  const publishWeek = async () => {
    // if (selectedWeek.videos.length < 10) {
    //   toast.error("Need 10 videos to publish bro! Fill it up!");
    //   return;
    // }

    if (!window.confirm("PUBLISH THIS TOP 10? This locks it forever!")) return;

    setActionLoading(true);
    toast.loading("Publishing Top 10... this might take a sec");

    try {
      await axios.put(
        `${BASE_URL}admin/top10/week/${selectedWeek.id}/publish`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success("TOP 10 PUBLISHED — 10 LEGENDS CROWNED!");
      fetchWeeks();
    } catch (err) {
      const msg = err.response?.data?.message || "Publish failed — server said no";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const removeVideo = async (videoId) => {
    if (!window.confirm("Kick this video out the Top 10?")) return;

    setActionLoading(true);
    toast.loading("Removing video...");

    try {
      await axios.delete(
        `${BASE_URL}admin/top10/week/${selectedWeek.id}/video/${videoId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success("Video removed — next!");
      fetchWeeks();
    } catch (err) {
      toast.error("Remove failed — already gone?");
    } finally {
      setActionLoading(false);
    }
  };

  const SortableVideo = ({ entry, index }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.video.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

    return (
      <div ref={setNodeRef} style={style} className={`flex items-center gap-4 p-4 rounded-lg border-2 ${isDragging ? 'border-blue-500 shadow-2xl z-50' : 'border-gray-300'} bg-white transition-all`}>
        <div className="text-2xl font-bold text-gray-500 w-12 text-center">#{index + 1}</div>

        {useDragDrop ? (
          <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
            <GripVertical size={28} className="text-gray-500" />
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => moveVideo(entry.video.id, 'up')} disabled={actionLoading} className="text-blue-600 hover:bg-blue-50 p-2 rounded"><ArrowUp size={20} /></button>
            <button onClick={() => moveVideo(entry.video.id, 'down')} disabled={actionLoading} className="text-blue-600 hover:bg-blue-50 p-2 rounded"><ArrowDown size={20} /></button>
          </div>
        )}

        <img src={entry.video.thumbnailUrl} alt="" className="w-32 h-20 object-cover rounded-lg" />
        <div className="flex-1">
          <h3 className="font-bold text-lg">{entry.video.title}</h3>
          <p className="text-gray-600">by {entry.video.user.name}</p>
        </div>

        {!selectedWeek?.isActive && (
          <button onClick={() => removeVideo(entry.video.id)} disabled={actionLoading} className="text-red-600 hover:bg-red-100 p-3 rounded-lg transition">
            <X size={22} />
          </button>
        )}
      </div>
    );
  };

  // NEW: Show loading full screen
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={60} />
          <p className="text-xl text-gray-600">Loading Top 10 weeks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

      {/* HEADER WITH BACK BUTTON */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {selectedWeek && (
            <button onClick={goBackToWeeks} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
              <ArrowLeft size={28} />
            </button>
          )}
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Trophy className="text-yellow-500" size={40} />
              Top 10 Manager
            </h1>
            <p className="text-gray-600 mt-2">Crown the weekly legends</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setIsCreateWeekOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold">
            <Calendar size={22} /> New Week
          </button>
          {activeWeek && (
            <a href="/top10" target="_blank" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold">
              <ExternalLink size={22} /> View Live
            </a>
          )}
        </div>
      </div>

      {/* ACTIVE WEEK BANNER */}
      {activeWeek && !selectedWeek && (
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Trophy className="text-green-500" /> Current Live Top 10
          </h2>
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white p-8 rounded-3xl shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-4xl font-bold">
                  Week of {format(new Date(activeWeek.weekStart), 'MMMM d, yyyy')}
                </h3>
                <p className="text-xl opacity-90 mt-2">
                  {format(new Date(activeWeek.weekStart), 'MMM d')} - {format(new Date(activeWeek.weekEnd), 'MMM d, yyyy')}
                </p>
              </div>
              <span className="bg-white text-purple-600 px-6 py-3 rounded-full text-2xl font-bold shadow-lg">
                LIVE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {activeWeek.videos.map((entry, i) => (
                <div key={entry.video.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 flex items-center gap-6 hover:bg-white/20 transition">
                  <div className="text-6xl font-bold text-yellow-300">#{i + 1}</div>
                  <img src={entry.video.thumbnailUrl} alt="" className="w-40 h-24 object-cover rounded-xl shadow-lg" />
                  <div>
                    <h4 className="text-2xl font-bold">{entry.video.title}</h4>
                    <p className="text-lg opacity-90">by {entry.video.user.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* WEEK EDITOR — ONLY SHOW WHEN SELECTED */}
      {selectedWeek && (
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold">
                Week of {format(new Date(selectedWeek.weekStart), 'MMMM d, yyyy')}
                {selectedWeek.isActive && <span className="ml-4 bg-green-500 text-white px-4 py-2 rounded-full text-lg font-bold">LIVE</span>}
              </h2>
              <p className="text-gray-600 mt-2">{selectedWeek.videos.length}/10 videos</p>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-3 text-lg">
                <input type="checkbox" checked={useDragDrop} onChange={(e) => setUseDragDrop(e.target.checked)} className="w-5 h-5" />
                <span>Drag to Reorder</span>
              </label>

              {!selectedWeek.isActive && (
                <>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    disabled={selectedWeek.videos.length >= 10 || actionLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
                  >
                    <Plus size={24} /> Add Video
                  </button>

                  {/* PUBLISH BUTTON — NOW ALWAYS VISIBLE WHEN 10 VIDEOS */}
                  {
                //   selectedWeek.videos.length === 10 && 
                  (
                    <button
                      onClick={publishWeek}
                      disabled={actionLoading}
                      className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg flex items-center gap-3 disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="animate-spin" /> : <Trophy size={28} />}
                      PUBLISH TOP 10
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* DRAG LIST */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={selectedWeek.videos.map(v => v.video.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {selectedWeek.videos.map((entry, i) => (
                  <SortableVideo key={entry.video.id} entry={entry} index={i} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {selectedWeek.videos.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              <Trophy size={80} className="mx-auto mb-4 opacity-20" />
              <p className="text-2xl">No videos yet — add some legends!</p>
            </div>
          )}
        </div>
      )}

      {/* ALL WEEKS GRID — ONLY SHOW WHEN NO WEEK SELECTED */}
      {!selectedWeek && (
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold mb-8">All Top 10 Weeks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weeks.map(week => (
              <button
                key={week.id}
                onClick={() => setSelectedWeek(week)}
                className={`p-6 rounded-2xl border-4 text-left transition-all hover:shadow-xl ${
                  week.isActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                <div className="font-bold text-xl">Week {week.weekNumber}, {week.year}</div>
                <div className="text-gray-600 mt-1">
                  {format(new Date(week.weekStart), 'MMM d')} - {format(new Date(week.weekEnd), 'MMM d')}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-2xl font-bold">{week.videos.length}/10</span>
                  {week.isActive && <span className="bg-green-500 text-white px-4 py-2 rounded-full font-bold">LIVE</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      <AddVideoModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} weekId={selectedWeek?.id} onSuccess={fetchWeeks} />
      <CreateWeekModal isOpen={isCreateWeekOpen} onClose={() => setIsCreateWeekOpen(false)} onSuccess={fetchWeeks} />
    </div>
  );
};

export default Top10Manager;