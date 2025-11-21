// src/pages/admin/Videos
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, Search, Filter, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import VideoTable from "../components/videos/VideoTable";
import VideoCards from "../components/videos/VideoCards";
import VideoFilters from "../components/videos/VideoFilters";
import BulkActionBar from "../components/videos/BulkActionBar";
import ConfirmModal from "../components/videos/ConfirmModal";
import VideoStats from "../components/videos/VideoStats";
import { useAppContext } from "../contexts/AppContext";

const CATEGORIES = [
  "All",
  "Stick Fights",
  "Tutorials",
  "Collabs",
  "Assets",
  "Animations",
  "Other",
];

const Videos = () => {
  const { fetchVideos, accessToken, BASE_URL } = useAppContext();

  const [videos, setVideos] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1,
    hasPrevPage: false,
    hasNextPage: false,
  });
  const [stats, setStats] = useState({
    totalVideos: 0,
    approvedVideos: 0,
    unapprovedVideos: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    isApproved: "All",
    category: "All",
    featured: "All",
    startDate: null,
    endDate: null,
  });
  const [tempFilters, setTempFilters] = useState({ ...filters }); // for "Apply" button
  const [sort, setSort] = useState({ column: "createdAt", direction: "desc" });
  const [limit, setLimit] = useState(10);
  const [selectedVideos, setSelectedVideos] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [actionVideoId, setActionVideoId] = useState(null);

  // Fetch videos
  const fetchVideosData = useCallback(async () => {
    setIsLoading(true);
    const params = {
      page: pagination.currentPage,
      limit,
      ...(tempFilters.search && { search: tempFilters.search }),
      ...(tempFilters.isApproved !== "All" && {
        isApproved: tempFilters.isApproved === "Approved",
      }),
      ...(tempFilters.category !== "All" && { category: tempFilters.category }),
      ...(tempFilters.featured !== "All" && {
        featured: tempFilters.featured === "Featured",
      }),
      ...(tempFilters.startDate && {
        startDate: tempFilters.startDate.toISOString(),
      }),
      ...(tempFilters.endDate && {
        endDate: tempFilters.endDate.toISOString().split("T")[0],
      }),
      sort: `${sort.direction === "desc" ? "-" : ""}${sort.column}`,
    };

    const response = await fetchVideos(params);
    if (response.success) {
      setVideos(response.data.videos);
      setPagination(response.data.pagination);
      setStats(response.stats || stats);
    } else {
      toast.error(response.message || "Failed to load videos");
    }
    setIsLoading(false);
  }, [fetchVideos, pagination.currentPage, limit, tempFilters, sort]);

  useEffect(() => {
    fetchVideosData();
  }, [fetchVideosData]);

  const applyFilters = () => {
    setFilters(tempFilters);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const resetFilters = () => {
    const reset = {
      search: "",
      isApproved: "All",
      category: "All",
      featured: "All",
      startDate: null,
      endDate: null,
    };
    setTempFilters(reset);
    setFilters(reset);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) =>
    setPagination((prev) => ({ ...prev, currentPage: page }));
  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const toggleSelectAll = () => {
    setSelectedVideos((prev) =>
      prev.length === videos.length ? [] : videos.map((v) => v.id)
    );
  };

  const toggleVideoSelect = (id) => {
    setSelectedVideos((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const openAction = (action, videoId = null) => {
    setModalAction(action);
    setActionVideoId(videoId);
    setIsModalOpen(true);
  };

  const isMobile = window.innerWidth < 768;
  useEffect(() => {
    const handleResize = () => window.location.reload(); // simple mobile switch
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Videos Management
          </h1>
          <VideoStats stats={stats} />
        </div>

        <VideoFilters
          tempFilters={tempFilters}
          setTempFilters={setTempFilters}
          onApply={applyFilters}
          onReset={resetFilters}
          limit={limit}
          onLimitChange={handleLimitChange}
        />

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">No videos found</p>
            <p className="mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {isMobile ? (
              <VideoCards
                videos={videos}
                selectedVideos={selectedVideos}
                toggleVideoSelect={toggleVideoSelect}
                openAction={openAction}
                accessToken={accessToken}
                BASE_URL={BASE_URL}
                fetchVideosData={fetchVideosData}
              />
            ) : (
              <VideoTable
                videos={videos}
                selectedVideos={selectedVideos}
                toggleSelectAll={toggleSelectAll}
                toggleVideoSelect={toggleVideoSelect}
                openAction={openAction}
                sort={sort}
                setSort={setSort}
                pagination={pagination}
                handlePageChange={handlePageChange}
                accessToken={accessToken}
                BASE_URL={BASE_URL}
                fetchVideosData={fetchVideosData}
              />
            )}
          </>
        )}

        {/* Floating Bulk Action Bar */}
        {selectedVideos.length > 0 && (
          <BulkActionBar
            count={selectedVideos.length}
            onBulkDelete={() => openAction("bulkDelete")}
            onClose={() => setSelectedVideos([])}
          />
        )}

        {/* Confirm Modal */}
        <ConfirmModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          action={modalAction}
          videoId={actionVideoId}
          selectedCount={
            modalAction === "bulkDelete" ? selectedVideos.length : null
          }
          selectedVideos={modalAction === "bulkDelete" ? selectedVideos : null}
          accessToken={accessToken}
          BASE_URL={BASE_URL}
          onSuccess={() => {
            setSelectedVideos([]);
            fetchVideosData();
          }}
        />
      </div>
    </>
  );
};

export default Videos;
