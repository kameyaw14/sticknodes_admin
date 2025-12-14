import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Trophy, Plus, Calendar, Users, Clock, CheckCircle } from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { toast } from "sonner";

// Helper to get next Monday (or current if today is Monday)
const getNextMonday = () => {
  const today = new Date(); // local date
  const day = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const diff = day === 1 ? 7 : (8 - day) % 7; // days to next Monday
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + diff);
  // Reset time to midnight local
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
};

const BestOfTheWeek = () => {
  const { BASE_URL, accessToken } = useAppContext();

  const [weeksData, setWeeksData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
  const nextMon = getNextMonday();
  // Format YYYY-MM-DD safely in local timezone
  return nextMon.toISOString().split('T')[0];
});
  const [creating, setCreating] = useState(false);

  // Fetch all weeks on mount
  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${BASE_URL}admin/top10`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        console.log('weeks: ',res.data)
        setWeeksData({
          activeWeek: res.data.activeWeek,
          pastWeeks: res.data.pastWeeks,
        });
      } catch (err) {
        console.error("Failed to load weeks:", err);
        setError(err.response?.data?.message || "Failed to load weeks");
        toast.error("Failed to load Top 10 weeks");
      } finally {
        setLoading(false);
      }
    };

    fetchWeeks();
  }, [BASE_URL, accessToken]);

  // Handle create new week
  const handleCreateWeek = async () => {
    if (creating) return;

    const startDate = new Date(selectedDate); // browser parses YYYY-MM-DD as local midnight
if (startDate.getUTCDay() !== 1) { // still checks UTC day — Monday is Monday everywhere
  toast.error("Week must start on a Monday bro!");
  return;
}
    try {
      setCreating(true);
      await axios.post(
        `${BASE_URL}admin/top10/week`,
        { weekStart: startDate.toISOString() },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      toast.success("New week created! Ready to add nominees.");
      setIsCreateModalOpen(false);

      // Refresh weeks list
      const res = await axios.get(`${BASE_URL}admin/top10`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setWeeksData({
        activeWeek: res.data.activeWeek,
        pastWeeks: res.data.pastWeeks,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create week");
    } finally {
      setCreating(false);
    }
  };

  // Find the "current relevant" week for display
  const getCurrentRelevantWeek = () => {
    if (!weeksData) return null;

    // Priority: any OPEN week → most important
    const openWeek = weeksData.pastWeeks.find(w => w.votingStatus === "OPEN");
    if (openWeek) return { week: openWeek, type: "open" };

    // Then CLOSED (ready to publish)
    const closedWeek = weeksData.pastWeeks.find(w => w.votingStatus === "CLOSED");
    if (closedWeek) return { week: closedWeek, type: "closed" };

    // Then latest PENDING
    const pendingWeeks = weeksData.pastWeeks
      .filter(w => w.votingStatus === "PENDING")
      .sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart));
    if (pendingWeeks.length > 0) return { week: pendingWeeks[0], type: "pending" };

    return null;
  };

  const current = getCurrentRelevantWeek();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <Trophy className="w-10 h-10 text-yellow-600" />
              <h1 className="text-4xl font-bold text-gray-900">
                Best of the Week Management
              </h1>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create New Week
            </button>
          </div>

          {loading && (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading weeks...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Current Active Published Week */}
              {weeksData?.activeWeek && (
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-yellow-200">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-8 h-8 text-yellow-600" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      Current Published Week
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-gray-600">Week</p>
                      <p className="text-xl font-semibold">
                        {new Date(weeksData.activeWeek.weekStart).toLocaleDateString()} -{" "}
                        {new Date(weeksData.activeWeek.weekEnd).toLocaleDateString()}
                      </p>
                    </div>
                    {weeksData.activeWeek.videos?.[0]?.video && (
                      <>
                        <div>
                          <p className="text-gray-600">#1 Video</p>
                          <p className="font-semibold">
                            {weeksData.activeWeek.videos[0].video.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            by {weeksData.activeWeek.videos[0].video.user.name}
                          </p>
                        </div>
                        <div className="flex justify-center">
                          <img
                            src={weeksData.activeWeek.videos[0].video.thumbnailUrl}
                            alt="Winner"
                            className="w-32 h-32 object-cover rounded-xl shadow-md"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Current Voting Status */}
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Clock className="w-7 h-7 text-blue-600" />
                  Current Voting Status
                </h2>

                {current ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-medium">
                          Week of {new Date(current.week.weekStart).toLocaleDateString()}
                        </p>
                        <p className="text-gray-600">
                          {current.week.nominees?.length || 0} nominees •{" "}
                          {current.week.totalVotesCast || 0} votes cast
                        </p>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-full font-medium text-sm ${
                          current.type === "open"
                            ? "bg-green-100 text-green-800"
                            : current.type === "closed"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {current.week.votingStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 italic">
                    No active voting week right now. Create one to get started!
                  </p>
                )}
              </div>

              {/* Navigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link
                  to="/admin/best-of-the-week/add-nominees"
                  className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition text-center border border-gray-200"
                >
                  <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Add Nominees</h3>
                  <p className="text-gray-600">
                    Search and add videos to the upcoming week
                  </p>
                </Link>

                <Link
                  to="/admin/best-of-the-week/current"
                  className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition text-center border border-gray-200"
                >
                  <Calendar className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Manage Current Week</h3>
                  <p className="text-gray-600">
                    Open/close voting, publish results
                  </p>
                </Link>

                <Link
                  to="/admin/best-of-the-week/past"
                  className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition text-center border border-gray-200"
                >
                  <Trophy className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">View Past Weeks</h3>
                  <p className="text-gray-600">
                    See all published Top 10 results
                  </p>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Week Modal */}
      {isCreateModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsCreateModalOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">Create New Top 10 Week</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Week Start (Monday only)
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {new Date(selectedDate + "T00:00:00Z").getUTCDay() !== 1 && selectedDate && (
                  <p className="text-red-600 text-sm mt-2">
                    Please select a Monday
                  </p>
                )}
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWeek}
                  disabled={creating}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition disabled:opacity-70"
                >
                  {creating ? "Creating..." : "Create Week"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default BestOfTheWeek;