import React, { useState, useEffect } from "react";
import axios from "axios";
import { Trash2, RefreshCw, Play, Pause, Trophy, AlertTriangle, Check } from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { toast } from "sonner";

const CurrentWeekManager = () => {
  const { BASE_URL, accessToken } = useAppContext();

  const [relevantWeek, setRelevantWeek] = useState(null); // the one we're managing
  const [nominees, setNominees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [removeModal, setRemoveModal] = useState({ open: false, videoId: null, title: "" });
  const [actionModal, setActionModal] = useState({ open: false, action: "", message: "" });
  const [publishModal, setPublishModal] = useState(false);

  // Fetch all weeks and pick the most relevant one
  const fetchRelevantWeek = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}admin/top10`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const allWeeks = [...(res.data.pastWeeks || []), res.data.activeWeek].filter(Boolean);

      // Priority: OPEN > CLOSED > latest PENDING
      let target = allWeeks.find(w => w.votingStatus === "OPEN");
      if (!target) target = allWeeks.find(w => w.votingStatus === "CLOSED");
      if (!target) {
        const pending = allWeeks
          .filter(w => w.votingStatus === "PENDING")
          .sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart));
        target = pending[0] || null;
      }

      setRelevantWeek(target);

      if (target) {
        fetchNominees(target.id);
      }
    } catch (err) {
      toast.error("Failed to load weeks bro");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch nominees + votes for specific week
  const fetchNominees = async (weekId) => {
    try {
      setRefreshing(true);
      const res = await axios.get(`${BASE_URL}admin/top10/week/${weekId}/nominees`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setNominees(res.data.nominees || []);
    } catch (err) {
      toast.error("Failed to load nominees");
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRelevantWeek();
  }, [BASE_URL, accessToken]);

  // Manual refresh during OPEN
  const handleRefresh = () => {
    if (relevantWeek) fetchNominees(relevantWeek.id);
  };

  // Remove nominee (PENDING only)
  const handleRemove = async () => {
    if (!removeModal.videoId) return;

    try {
      await axios.delete(
        `${BASE_URL}admin/top10/week/${relevantWeek.id}/nominee/${removeModal.videoId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      toast.success(`"${removeModal.title}" removed from nominees`);
      setNominees(prev => prev.filter(n => n.videoId !== removeModal.videoId));
      setRemoveModal({ open: false, videoId: null, title: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove nominee");
    }
  };

  // Open or Close voting
  const handleVotingAction = async (action) => {
    try {
      const endpoint =
        action === "open"
          ? `${BASE_URL}admin/top10/week/${relevantWeek.id}/open-voting`
          : `${BASE_URL}admin/top10/week/${relevantWeek.id}/close-voting`;

      await axios.put(endpoint, {}, { headers: { Authorization: `Bearer ${accessToken}` } });

      toast.success(action === "open" ? "Voting is now OPEN!" : "Voting CLOSED — results final");
      fetchRelevantWeek(); // refresh status
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} voting`);
    }
    setActionModal({ open: false, action: "", message: "" });
  };

  // Publish results
  const handlePublish = async () => {
    try {
      await axios.put(
        `${BASE_URL}admin/top10/week/${relevantWeek.id}/publish`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      toast.success("TOP 10 PUBLISHED — THE COMMUNITY HAS SPOKEN! 🎉");
      setPublishModal(false);
      fetchRelevantWeek();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to publish Top 10");
    }
  };

  const statusColor = {
    PENDING: "bg-blue-100 text-blue-800",
    OPEN: "bg-green-100 text-green-800",
    CLOSED: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Trophy className="w-10 h-10 text-yellow-600" />
            <h1 className="text-4xl font-bold text-gray-900">Manage Current Week</h1>
          </div>
          {relevantWeek?.votingStatus === "OPEN" && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-medium transition disabled:opacity-70"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Votes
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : !relevantWeek ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-xl">
            <p className="text-xl text-gray-600">
              No active week right now. Create one or wait for voting to start.
            </p>
          </div>
        ) : (
          <>
            {/* Week Info Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    Week of {new Date(relevantWeek.weekStart).toLocaleDateString()} -{" "}
                    {new Date(relevantWeek.weekEnd).toLocaleDateString()}
                  </h2>
                  <p className="text-gray-600 mt-2">
                    {nominees.length} nominees • {relevantWeek.totalVotesCast} total votes cast
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-6 py-3 rounded-full font-bold text-lg ${statusColor[relevantWeek.votingStatus] || ""}`}>
                    {relevantWeek.votingStatus.toUpperCase()}
                  </span>

                  {/* Action Buttons */}
                  {relevantWeek.votingStatus === "PENDING" && (
                    <button
                      onClick={() => setActionModal({
                        open: true,
                        action: "open",
                        message: "Open voting now? Users will be able to vote and no more nominees can be added/removed."
                      })}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition shadow-lg"
                    >
                      <Play className="w-5 h-5" />
                      Open Voting
                    </button>
                  )}

                  {relevantWeek.votingStatus === "OPEN" && (
                    <button
                      onClick={() => setActionModal({
                        open: true,
                        action: "close",
                        message: "Close voting now? Results will be final and ready for publishing."
                      })}
                      className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-medium transition shadow-lg"
                    >
                      <Pause className="w-5 h-5" />
                      Close Voting
                    </button>
                  )}

                  {relevantWeek.votingStatus === "CLOSED" && (
                    <button
                      onClick={() => setPublishModal(true)}
                      className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-xl font-medium transition shadow-lg"
                    >
                      <Trophy className="w-5 h-5" />
                      Publish Results
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Nominees Grid */}
            <h3 className="text-2xl font-bold mb-6">Current Nominees</h3>
            {refreshing ? (
              <div className="text-center py-12">Refreshing votes...</div>
            ) : nominees.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-xl">
                <p className="text-xl text-gray-600">No nominees yet — add some!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {nominees.map((nominee, index) => (
                  <div key={nominee.videoId} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
                    <div className="relative">
                      <img
                        src={nominee.video.thumbnailUrl}
                        alt={nominee.video.title}
                        className="w-full h-48 object-cover"
                      />
                      {relevantWeek.votingStatus !== "PENDING" && (
                        <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {nominee.votes} votes
                        </div>
                      )}
                      {relevantWeek.votingStatus === "CLOSED" && (
                        <div className="absolute top-2 left-2 bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                          #{index + 1}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-lg line-clamp-2 mb-1">{nominee.video.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">by {nominee.video.user.name}</p>

                      {relevantWeek.votingStatus === "PENDING" && (
                        <button
                          onClick={() => setRemoveModal({
                            open: true,
                            videoId: nominee.videoId,
                            title: nominee.video.title
                          })}
                          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-medium transition"
                        >
                          <Trash2 className="w-5 h-5" />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Remove Confirmation Modal */}
      {removeModal.open && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setRemoveModal({ open: false })} />
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                Remove Nominee?
              </h3>
              <p className="text-gray-700 mb-8">
                Are you sure you want to remove "<strong>{removeModal.title}</strong>" from nominees?
              </p>
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setRemoveModal({ open: false })}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemove}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Open/Close Voting Modal */}
      {actionModal.open && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setActionModal({ open: false })} />
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold mb-4">
                {actionModal.action === "open" ? "Open Voting?" : "Close Voting?"}
              </h3>
              <p className="text-gray-700 mb-8">{actionModal.message}</p>
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setActionModal({ open: false })}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleVotingAction(actionModal.action)}
                  className={`px-6 py-3 text-white rounded-xl font-medium transition ${
                    actionModal.action === "open" ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Publish Modal with Preview */}
      {publishModal && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setPublishModal(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full my-8">
              <h3 className="text-3xl font-bold mb-6 text-red-600 flex items-center gap-3">
                <AlertTriangle className="w-10 h-10" />
                PUBLISH TOP 10 — FINAL STEP
              </h3>
              <p className="text-lg text-gray-700 mb-8">
                This will crown the winners, send notifications, deactivate the old week, and make results public.
                <strong className="block mt-2 text-red-600">There is NO UNDO.</strong>
              </p>

              <h4 className="text-2xl font-bold mb-4">Final Ranking Preview</h4>
              {nominees.length === 0 ? (
                <p className="text-gray-600 italic py-8 text-center">No nominees — cannot publish empty Top 10</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {nominees.slice(0, 10).map((n, i) => (
                    <div key={n.videoId} className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
                      <div className="text-3xl font-bold text-yellow-600 w-12">#{i + 1}</div>
                      <img src={n.video.thumbnailUrl} alt="" className="w-24 h-24 object-cover rounded-lg" />
                      <div>
                        <p className="font-bold">{n.video.title}</p>
                        <p className="text-sm text-gray-600">by {n.video.user.name}</p>
                        <p className="text-sm font-medium mt-1">{n.votes} votes</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {nominees.length < 10 && nominees.length > 0 && (
                <p className="text-orange-600 font-medium mb-6">
                  Only {nominees.length} videos nominated — Top {nominees.length} will be published.
                </p>
              )}

              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setPublishModal(false)}
                  className="px-8 py-4 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium text-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  disabled={nominees.length === 0}
                  className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                  <Trophy className="w-6 h-6" />
                  PUBLISH TOP 10
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CurrentWeekManager;