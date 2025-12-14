import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Search, Users, Plus, Trophy } from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { toast } from "sonner";
import debounce from "lodash.debounce"; // npm install lodash if not already

const AddNominees = () => {
  const { BASE_URL, accessToken } = useAppContext();

  // Main state bro
  const [pendingWeeks, setPendingWeeks] = useState([]); // all PENDING weeks for dropdown
  const [selectedWeekId, setSelectedWeekId] = useState(""); // current target week
  const [currentNominees, setCurrentNominees] = useState([]); // videoIds already nominated this week
  const [nomineeCount, setNomineeCount] = useState(0);

  const [videos, setVideos] = useState([]); // search results
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [addingVideoId, setAddingVideoId] = useState(null); // for button spinner

  const observerRef = useRef(); // for infinite scroll

  // Fetch all weeks + extract PENDING ones
  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        const res = await axios.get(`${BASE_URL}admin/top10`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const allPast = res.data.pastWeeks || [];
        const pending = allPast.filter((w) => w.votingStatus === "PENDING");

        // Sort newest first bro
        pending.sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart));

        setPendingWeeks(pending);

        // Auto-select the latest PENDING week
        if (pending.length > 0) {
          setSelectedWeekId(pending[0].id);
        }
      } catch (err) {
        toast.error("Failed to load weeks bro");
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchWeeks();
  }, [BASE_URL, accessToken]);

  // When selected week changes → reset everything and fetch nominees
  useEffect(() => {
    if (!selectedWeekId) {
      setCurrentNominees([]);
      setNomineeCount(0);
      setVideos([]);
      return;
    }

    const fetchNominees = async () => {
      try {
        const res = await axios.get(`${BASE_URL}admin/top10`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const week = [...res.data.pastWeeks, res.data.activeWeek || []]
          .flat()
          .find((w) => w.id === selectedWeekId);

        if (week) {
          const nomineeVideoIds = week.nominees?.map((n) => n.videoId) || [];
          setCurrentNominees(nomineeVideoIds);
          setNomineeCount(nomineeVideoIds.length);
        }
      } catch (err) {
        toast.error("Failed to load nominees for this week");
      }
    };

    fetchNominees();
    setVideos([]);
    setPage(1);
    setHasMore(true);
  }, [selectedWeekId, BASE_URL, accessToken]);

  // Debounced search bro — don't hammer the server
  const debouncedSearch = useCallback(
    debounce((query) => {
      setVideos([]);
      setPage(1);
      setHasMore(true);
      fetchVideos(query, 1);
    }, 500),
    [selectedWeekId]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  // Fetch videos from public endpoint
  const fetchVideos = async (query = "", pageNum = 1) => {
    if (loading && pageNum > 1) return; // prevent double load

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum,
        limit: 20,
        sort: "createdAt:desc",
      });
      if (query.trim()) params.append("search", query.trim());

      const res = await axios.get(`${BASE_URL}video/videos?${params}`);

      const newVideos = res.data.data.videos || [];

      if (pageNum === 1) {
        setVideos(newVideos);
      } else {
        setVideos((prev) => [...prev, ...newVideos]);
      }

      setHasMore(newVideos.length === 20);
    } catch (err) {
      toast.error("Failed to load videos bro");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load when week selected
  useEffect(() => {
    if (selectedWeekId && initialLoading === false) {
      fetchVideos(searchQuery, 1);
    }
  }, [selectedWeekId]);

  // Infinite scroll observer
  const lastVideoRef = useCallback(
    (node) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
          fetchVideos(searchQuery, page + 1);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, searchQuery, page]
  );

  // Add nominee function
  const handleAddNominee = async (videoId) => {
    if (addingVideoId) return;

    try {
      setAddingVideoId(videoId);
      await axios.post(
        `${BASE_URL}admin/top10/week/${selectedWeekId}/nominee`,
        { videoId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      // Success — update state locally bro
      setCurrentNominees((prev) => [...prev, videoId]);
      setNomineeCount((prev) => prev + 1);
      const msg = "Nominee added! Ready for battle 🔥"
      toast.success(msg);
      alert(msg);

    } catch (err) {
      console.error("Add nominee error:", err);
      const msg = err.response?.data?.message || "Failed to add nominee";
      toast.error(msg);
      alert(msg);
    } finally {
      setAddingVideoId(null);
    }
  };

  const isNominated = (videoId) => currentNominees.includes(videoId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Trophy className="w-8 h-8 text-yellow-600" />
              <h1 className="text-3xl font-bold text-gray-900">Add Nominees</h1>
            </div>

            {/* Week Selector + Count */}
            {pendingWeeks.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">
                    Target Week:
                  </label>
                  <select
                    value={selectedWeekId}
                    onChange={(e) => setSelectedWeekId(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    {pendingWeeks.map((week) => (
                      <option key={week.id} value={week.id}>
                        Week of {new Date(week.weekStart).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full">
                  <Users className="w-5 h-5 text-blue-700" />
                  <span className="font-medium text-blue-900">
                    Currently {nomineeCount} nominees
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 italic">
                No PENDING weeks — create one first!
              </p>
            )}
          </div>

          {/* Search Bar */}
          <div className="mt-6">
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search approved videos by title..."
                className="w-full pl-12 pr-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {initialLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : pendingWeeks.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600">
              No PENDING weeks available. Go create one first bro!
            </p>
          </div>
        ) : (
          <>
            {videos.length === 0 && !loading ? (
              <div className="text-center py-20">
                <p className="text-xl text-gray-600">
                  {searchQuery
                    ? "No videos found for your search"
                    : "Type to search approved videos"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {videos.map((video, index) => {
                  const nominated = isNominated(video.id);
                  const isLast = index === videos.length - 1;

                  return (
                    <div
                      key={video.id}
                      ref={isLast ? lastVideoRef : null}
                      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition"
                    >
                      <img
                        src={video.thumbnail.url}
                        alt={video.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-bold text-lg line-clamp-2 mb-1">
                          {video.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          by {video.user.name}
                        </p>

                        <button
                          onClick={() => handleAddNominee(video.id)}
                          disabled={nominated || addingVideoId === video.id}
                          className={`w-full py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                            nominated
                              ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {addingVideoId === video.id ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : nominated ? (
                            "Already nominated"
                          ) : (
                            <>
                              <Plus className="w-5 h-5" />
                              Add Nominee
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Loading more & end message */}
            {loading && (
              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl shadow-lg animate-pulse"
                  >
                    <div className="w-full h-48 bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-6 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-10 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!hasMore && videos.length > 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  No more videos bro — that's all!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AddNominees;
