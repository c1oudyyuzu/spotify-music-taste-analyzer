import { customGet } from "../utils/serverUtils";

export const getNewReleases = async (session) => {
  return customGet(
    "https://api.spotify.com/v1/browse/new-releases?country=IN&limit=15",
    session
  ).then((data) => data.albums.items);
};

export const getRecentlyPlayedTracks = async (session, limit = 50) => {
  return customGet(
    `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
    session
  );
};

// https://developer.spotify.com/documentation/web-api/reference/get-users-saved-tracks
export const getUserSavedTracks = async (session, limit = 50, offset = 0) => {
  const data = await customGet(
    `https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`,
    session
  );
  return data.items;
};

// https://developer.spotify.com/documentation/web-api/reference/get-several-audio-features
export const getSeveralAudioFeatures = async (session, ids) => {
  const data = await customGet(
    `https://api.spotify.com/v1/audio-features?ids=${ids.join(",")}`,
    session
  );
  return data.audio_features;
};

// https://developer.spotify.com/documentation/web-api/reference/get-several-tracks
export const getSeveralTracks = async (session, ids) => {
  const data = await customGet(
    `https://api.spotify.com/v1/tracks?ids=${ids.join(",")}`,
    session
  );
  return data.tracks;
};

// https://developer.spotify.com/documentation/web-api/reference/get-multiple-albums
export const getSeveralAlbums = async (session, ids) => {
  const data = await customGet(
    `https://api.spotify.com/v1/albums?ids=${ids.join(",")}`,
    session
  );
  return data.albums;
};

// https://developer.spotify.com/documentation/web-api/reference/get-multiple-artists
export const getSeveralArtists = async (session, ids) => {
  console.log(ids);
  const data = await customGet(
    `https://api.spotify.com/v1/artists?ids=${ids.join(",")}`,
    session
  );
  console.log(data);
  return data.artists;
};

export const getTopItems = async ({
  session,
  timeRange = "short_term",
  limit = 50,
  type,
}) => {
  return customGet(
    `https://api.spotify.com/v1/me/top/${type}?time_range=${timeRange}&limit=${limit}`,
    session
  );
};

export const getAlbumById = async (session, albumId) => {
  return customGet(`https://api.spotify.com/v1/albums/${albumId}`, session);
};

export const getArtistById = async (session, artistId) => {
  return customGet(`https://api.spotify.com/v1/artists/${artistId}`, session);
};

export const getArtistDiscography = async (session, artistId) => {
  const baseUrl = `https://api.spotify.com/v1/artists/${artistId}`;

  const urls = [
    "",
    "/top-tracks?market=from_token",
    "/albums?include_groups=album",
    "/albums?include_groups=single",
    "/albums?include_groups=appears_on",
    "/albums?include_groups=compilation",
    "/related-artists",
  ];

  const promises = urls.map((url) => customGet(`${baseUrl}${url}`, session));
  return Promise.all(promises);
};

export const getCategoryById = async (session, categoryId) => {
  return customGet(
    `https://api.spotify.com/v1/browse/categories/${categoryId}`,
    session
  );
};

export const getPlaylistsByCategory = async (session, categoryId) => {
  const data = await customGet(
    `https://api.spotify.com/v1/browse/categories/${categoryId}/playlists?country=IN&limit=50`,
    session
  );
  return data.playlists.items;
};

export const getUserLikedAlbums = async (session) => {
  const data = await customGet(
    `https://api.spotify.com/v1/me/albums?market=from_token&limit=50`,
    session
  );
  return data.items.map((item) => item.album);
};

export const getUserLikedArtists = async (session) => {
  const data = await customGet(
    `https://api.spotify.com/v1/me/following?type=artist&limit=50`,
    session
  );
  return data.artists.items;
};

export const getUserLikedSongs = async (session) => {
  const data = await customGet(
    `https://api.spotify.com/v1/me/tracks?limit=50`,
    session
  );

  const finalData = { total: data.total, items: data.items };
  let limit = 50;
  let currUrl = data.next;

  while (currUrl !== null) {
    const nextData = await customGet(currUrl, session);
    finalData.items.push(...nextData.items);
    limit += 50;
    currUrl = nextData.next;
  }

  return {
    total: data.total,
    items: data.items.map((item) => item.track),
  };
};

export const getUserLikedPlaylists = async (session) => {
  const data = await customGet(
    "https://api.spotify.com/v1/me/playlists",
    session
  );
  return data.items;
};

export const getPlaylistById = async (session, playlistId) => {
  const data = await customGet(
    `https://api.spotify.com/v1/playlists/${playlistId}`,
    session
  );
  const playlist = data;

  let limit = 50;
  let currUrl = data.tracks.next;

  while (currUrl !== null) {
    const nextData = await customGet(currUrl, session);
    playlist.tracks.items.push(...nextData.items);
    limit += 50;
    currUrl = nextData.next;
  }

  return playlist;
};

export const getCategories = async (session) => {
  const data = await customGet(
    `https://api.spotify.com/v1/browse/categories?limit=50&country=IN`,
    session
  );
  return data.categories.items;
};

export const getSearchItems = async (session, type, query, limit = 5) => {
  let searchType;
  if (type === "all") {
    searchType = "album,artist,track,playlist";
  } else {
    searchType = type;
  }

  return customGet(
    `https://api.spotify.com/v1/search?q=${query}&market=from_token&type=${searchType}&limit=${limit}`,
    session
  );
};

export const getTrackById = async (session, trackId) => {
  return customGet(`https://api.spotify.com/v1/tracks/${trackId}`, session);
};

export const getTrackAnalysis = async (session, trackId) => {
  return customGet(
    `https://api.spotify.com/v1/audio-features/${trackId}`,
    session
  );
};

export const getTrackRecommendations = async (session, trackId) => {
  const trackAnalysis = await getTrackAnalysis(session, trackId);

  const trackFeatures = {
    acousticness: 1,
    danceability: 1,
    energy: 1,
    instrumentalness: 1,
    key: 1,
    liveness: 1,
    loudness: 1,
    mode: 1,
    speechiness: 1,
    tempo: 1,
    valence: 1,
  };

  const track = await getTrackById(session, trackId);
  const artist = await getArtistById(session, track.artists[0].id);

  let endpoint = `https://api.spotify.com/v1/recommendations?limit=30&seed_artists=${artist.id}&seed_tracks=${trackId}`;

  Object.entries(trackAnalysis).forEach(([key, value]) => {
    if (trackFeatures.hasOwnProperty(key)) {
      endpoint += `&target_${key}=${value}`;
    }
  });

  const data = await customGet(endpoint, session);

  return data.tracks;
};
