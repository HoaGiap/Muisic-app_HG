import axios from "axios";
import { getAuth } from "firebase/auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8080/api",
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  try {
    const u = getAuth().currentUser;
    if (u) {
      // ✅ ép refresh để chắc chắn có claim admin sau khi login/grant
      const t = await u.getIdToken(true);
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${t}`;
    }
  } catch {}
  return config;
});

export async function getArtistDetail(id) {
  const { data } = await api.get(`/artists/${id}`);
  return data; // { artist, albums, songs }
}
export async function getAlbumDetail(id) {
  const { data } = await api.get(`/albums/${id}`);
  return data; // { album, artist, songs }
}

export async function getRelatedArtists(id) {
  const { data } = await api.get(`/artists/${id}/related`);
  return data.related;
}
export async function getRelatedAlbums(id) {
  const { data } = await api.get(`/albums/${id}/related`);
  return data.related;
}

export async function followArtist(idOrName) {
  const { data } = await api.post(`/artists/${idOrName}/follow`);
  return data;
}
export async function unfollowArtist(idOrName) {
  const { data } = await api.post(`/artists/${idOrName}/unfollow`);
  return data;
}
export async function getMyFollowingArtists() {
  const { data } = await api.get(`/me/following/artists`);
  return data.artistIds; // string[]
}

// Albums admin
export async function createAlbum(payload) {
  const { data } = await api.post("/albums", payload);
  return data.album;
}

// Upload helper (đã có POST /api/upload?folder=music-app)
export async function uploadImage(file, folder = "music-app") {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post(
    `/upload?folder=${encodeURIComponent(folder)}`,
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data; // { url, public_id, duration? }
}

// Albums admin
export async function searchAlbums(q, limit = 20) {
  const { data } = await api.get("/albums", { params: { q, limit } });
  return data.items || [];
}
export async function getAlbumAdminDetail(id) {
  const { data } = await api.get(`/albums/${id}`);
  return data; // { album, artist, songs }
}
export async function updateAlbum(id, payload) {
  const { data } = await api.patch(`/albums/${id}`, payload);
  return data.album;
}

// Song search (để add track vào album)
export async function searchSongs(params) {
  // server của bạn đã có GET /api/songs?q=&sort=&page=&limit=
  const { data } = await api.get("/songs", { params });
  // trả về { items, total, page } hoặc mảng; normalize:
  return Array.isArray(data) ? data : data.items || [];
}

// Songs admin
export async function getSongDetail(id) {
  const { data } = await api.get(`/songs/${id}`);
  return data; // { song, artist }
}
export async function updateSong(id, payload) {
  const { data } = await api.patch(`/songs/${id}`, payload);
  return data.song;
}

// Search artists để gán artistId cho bài hát (đã có ở trên, dùng lại):
// export async function searchArtists(q, limit = 20) { ... }

// Upload audio (dùng chung /upload)
export async function uploadAudio(file, folder = "music-app/audios") {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post(
    `/upload?folder=${encodeURIComponent(folder)}`,
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data; // { url, public_id, duration }
}

export async function getSongLyrics(id) {
  const { data } = await api.get(`/songs/${id}/lyrics`);
  return data;
}
export async function saveSongLyrics(id, { lyrics, language }) {
  // Gửi cả hai cách để server phiên bản cũ/cải tiến đều nhận được:
  const body = { lyrics: { text: lyrics, language } };
  const { data } = await api.put(`/songs/${id}/lyrics`, body);
  return data;
}
export async function deleteSongById(id) {
  const { data } = await api.delete(`/songs/${id}`);
  return data; // { ok: true }
}

// Artists admin
export async function searchArtists(q, limit = 20) {
  const { data } = await api.get("/artists", { params: { q, limit } });
  return data.items || [];
}
export async function updateArtist(id, payload) {
  const { data } = await api.patch(`/artists/${id}`, payload);
  return data.artist;
}
export async function createArtist(payload) {
  // ⬅️ new
  const { data } = await api.post("/artists", payload);
  return data.artist;
}
export async function deleteArtist(id) {
  // ⬅️ new
  const { data } = await api.delete(`/artists/${id}`);
  return data;
}

export async function deleteAlbum(id) {
  const { data } = await api.delete(`/albums/${id}`);
  return data; // { ok: true }
}

// Gán / gỡ bài hát khỏi album
export async function assignSongToAlbum(songId, albumId) {
  const { data } = await api.patch(`/songs/${songId}`, { albumId });
  return data.song;
}
export async function removeSongFromAlbum(songId) {
  const { data } = await api.patch(`/songs/${songId}`, { albumId: null });
  return data.song;
}
