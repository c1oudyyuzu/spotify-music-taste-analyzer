import Head from "next/head";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  getSeveralAudioFeatures,
  getUserSavedTracks,
  getSeveralArtists,
} from "../lib/actions";
import { Chart } from "react-google-charts";

// https://github.com/jmcabreira-zz/A-Music-Taste-Analysis-Using-Spotify-API-and-Python./blob/master/Playlist_analysis_%20.ipynb

export default function Home() {
  const handleLogin = () => {
    signIn("spotify", { callbackUrl: "http://localhost:3000" });
  };
  const { data: session, status } = useSession();
  const [savedTracks, setSavedTracks] = useState([]);
  const [audioFeatures, setAudioFeatures] = useState([]);

  // Line graph for a specific feature, shows the means of every month
  useEffect(() => {
    if (!session || savedTracks.length > 0) return;
    (async () => {
      try {
        let limit = 2000;
        let savedTracks = [];
        for (let i = 0; i < limit - 1; i += 50) {
          console.log(`getting tracks ${i}-${i + 50}`);
          const tracks = await getUserSavedTracks(session, 50, i);
          const artistById = {};
          const allArtists = [
            ...new Set(
              tracks
                .map((track) => track.track.artists.map((artist) => artist.id))
                .flat()
            ),
          ];
          for (let j = 0; j < allArtists.length; j += 50) {
            const artists = await getSeveralArtists(
              session,
              allArtists.slice(j, j + 50)
            );
            artists.forEach((artist) => {
              artistById[artist.id] = artist;
            });
          }
          savedTracks.push(
            ...tracks.map((track) => ({
              ...track,
              track: {
                ...track.track,
                artists: track.track.artists.map(
                  (artist) => artistById[artist.id]
                ),
              },
            }))
          );
        }
        setSavedTracks(savedTracks);
        console.log(savedTracks);

        let audioFeatures = [];
        for (let i = 0; i < savedTracks.length - 50; i += 100) {
          console.log(`getting audio features for tracks ${i}-${i + 100}`);
          audioFeatures.push(
            ...(await getSeveralAudioFeatures(
              session,
              savedTracks
                .slice(i, i + 100)
                .map((savedTrack) => savedTrack.track.id)
            ))
          );
        }
        setAudioFeatures(audioFeatures);
        console.log(audioFeatures);
      } catch (e) {
        console.log(e);
      }
    })();
  }, [session]);

  if (status === "authenticated") {
    if (savedTracks.length == 0 || audioFeatures.length == 0) {
      return <p className="text-xl">Loading audio analysis...</p>;
    }

    // Bar Graph with the mean value of features
    const barStats = {
      acousticness: 0,
      danceability: 0,
      duration: 0,
      energy: 0,
      instrumentalness: 0,
      liveness: 0,
      loudness: 0,
      tempo: 0,
      valence: 0,
    };
    for (let i = 0; i < audioFeatures.length; i++) {
      barStats.acousticness += audioFeatures[i].acousticness;
      barStats.danceability += audioFeatures[i].danceability;
      barStats.duration += audioFeatures[i].duration;
      barStats.energy += audioFeatures[i].energy;
      barStats.instrumentalness += audioFeatures[i].instrumentalness;
      barStats.liveness += audioFeatures[i].liveness;
      barStats.loudness += audioFeatures[i].loudness;
      barStats.tempo += audioFeatures[i].tempo;
      barStats.valence += audioFeatures[i].valence;
    }
    Object.keys(barStats).forEach((key) => {
      barStats[key] /= audioFeatures.length;
    });

    const graphKey = "valence";

    const valencesOverTime = [];
    let tracks = 0;
    for (let i = savedTracks.length - 1; i >= 0; i--) {
      const savedTrack = savedTracks[i];
      const audioFeature = audioFeatures[i];
      if (valencesOverTime.length == 0) {
        valencesOverTime.push([
          savedTrack.added_at.slice(0, 7),
          audioFeature[graphKey],
        ]);
        tracks++;
      } else {
        const lastValence = valencesOverTime[valencesOverTime.length - 1];
        if (lastValence[0] == savedTrack.added_at.slice(0, 7)) {
          valencesOverTime[valencesOverTime.length - 1][1] +=
            audioFeature[graphKey];
          tracks++;
        } else {
          valencesOverTime[valencesOverTime.length - 1][1] /= tracks;
          tracks = 1;
          valencesOverTime.push([
            savedTrack.added_at.slice(0, 7),
            audioFeature[graphKey],
          ]);
        }
      }
    }
    valencesOverTime[valencesOverTime.length - 1][1] /= tracks;

    const valencesAndEnergy = [];
    for (let i = 0; i < savedTracks.length; i++) {
      const audioFeature = audioFeatures[i];
      valencesAndEnergy.push([audioFeature.valence, audioFeature.energy]);
    }

    const valencesAndDanceability = [];
    for (let i = 0; i < savedTracks.length; i++) {
      const audioFeature = audioFeatures[i];
      valencesAndDanceability.push([
        audioFeature.valence,
        audioFeature.danceability,
      ]);
    }

    const genreCount = {};

    function get(object, key, default_value) {
      var result = object[key];
      return typeof result !== "undefined" ? result : default_value;
    }

    for (let i = 0; i < savedTracks.length; i++) {
      const genres = savedTracks[i].track.artists
        .map((artist) => artist.genres.map((genre) => genre.split(",")).flat())
        .flat(); // string[]
      genres.forEach((genre) => {
        genreCount[genre] = get(genreCount, genre, 0) + 1;
      });
    }

    console.log(genreCount);

    const totalGenreCounts = [];
    Object.keys(genreCount)
      .sort((genreA, genreB) => {
        const countA = genreCount[genreA];
        const countB = genreCount[genreB];
        return countB - countA;
      })
      .slice(0, 20)
      .forEach((genre) => {
        const count = genreCount[genre];
        totalGenreCounts.push([genre, count]);
      });

    return (
      <div>
        <Chart
          chartType="BarChart"
          data={[
            ["Features", "Value"],
            ["Acousticness", barStats.acousticness],
            ["Danceability", barStats.danceability],
            ["Energy", barStats.energy],
            ["Instrumentalness", barStats.instrumentalness],
            ["Liveness", barStats.liveness],
            ["Valence", barStats.valence],
          ]}
          width="100%"
          height="400px"
          options={{
            title: "Analysis of Audio",
            chartArea: { width: "50%" },
            hAxis: {
              title: "Value",
            },
            vAxis: {
              title: "Feature",
            },
          }}
        />
        <Chart
          chartType="LineChart"
          width="100%"
          height="400px"
          data={[["Date", graphKey], ...valencesOverTime]}
          options={{ title: `${graphKey} over time` }}
        />
        <Chart
          chartType="ScatterChart"
          width="100%"
          height="400px"
          data={[["Valence", "Energy"], ...valencesAndEnergy]}
          options={{
            title: "Valence vs. Energy",
            hAxis: { title: "Valence" },
            vAxis: { title: "Energy" },
            pointSize: 3,
          }}
        />
        <Chart
          chartType="ScatterChart"
          width="100%"
          height="400px"
          data={[["Valence", "Danceability"], ...valencesAndDanceability]}
          options={{
            title: "Valence vs. Danceability",
            hAxis: { title: "Valence" },
            vAxis: { title: "Danceability" },
            pointSize: 3,
          }}
        />
        <Chart
          chartType="ColumnChart"
          data={[["Genres", "Value"], ...totalGenreCounts]}
          width="100%"
          height="400px"
          options={{
            title: "Genres",
            hAxis: {
              title: "Value",
            },
            vAxis: {
              title: "Genre",
            },
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col items-center justify-center w-screen h-screen gap-20">
        <Image
          src="/images/spotify_logo.png"
          alt="spotify logo"
          width={320}
          height={96}
        />
        <button
          className="flex px-12 py-2 text-lg tracking-widest uppercase rounded-full focus:outline-none bg-primary hover:bg-opacity-80"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </div>
  );
}
