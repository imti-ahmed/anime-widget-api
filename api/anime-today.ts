export default async function handler(req, res) {

  const username = "imtiahmed"

  const query = `
  query ($username: String) {
    MediaListCollection(userName: $username, type: ANIME, status: CURRENT) {
      lists {
        entries {
          media {
            title {
              romaji
              english
            }
            coverImage {
              medium
            }
            nextAiringEpisode {
              episode
              airingAt
            }
          }
        }
      }
    }
  }`

  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query,
      variables: { username }
    })
  })

  const data = await response.json()

  const entries = data.data.MediaListCollection.lists.flatMap(
    (list) => list.entries
  )

  const today = new Date()
  today.setHours(0,0,0,0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayEpisodes = entries
    .filter(e => e.media.nextAiringEpisode)
    .filter(e => {
      const airing = new Date(
        e.media.nextAiringEpisode.airingAt * 1000
      )
      return airing >= today && airing < tomorrow
    })
    .map(e => ({
      title: e.media.title.english || e.media.title.romaji,
      episode: e.media.nextAiringEpisode.episode,
      poster: e.media.coverImage.medium,
      time: new Date(
        e.media.nextAiringEpisode.airingAt * 1000
      ).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit'})
    }))

  res.setHeader("Cache-Control", "s-maxage=3600")

  res.status(200).json(todayEpisodes)
}
