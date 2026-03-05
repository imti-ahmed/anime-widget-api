export default async function handler(req, res) {

  const username = "imtiahmed"

  const query = `
  query ($username: String) {
    MediaListCollection(userName: $username, type: ANIME, status: CURRENT) {
      lists {
        entries {
          media {
            id
            title {
              english
              romaji
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

  const json = await response.json()

  const entries =
    json.data.MediaListCollection.lists.flatMap(
      list => list.entries
    )

  const now = new Date()

  const startOfDay = new Date(now)
  startOfDay.setHours(0,0,0,0)

  const endOfDay = new Date(now)
  endOfDay.setHours(23,59,59,999)

  const startUnix = Math.floor(startOfDay.getTime()/1000)
  const endUnix = Math.floor(endOfDay.getTime()/1000)

  let episodes = entries
    .filter(e => e.media.nextAiringEpisode)
    .filter(e => {
      const t = e.media.nextAiringEpisode.airingAt
      return t >= startUnix && t <= endUnix
    })
    .map(e => ({
      title: e.media.title.english || e.media.title.romaji,
      episode: e.media.nextAiringEpisode.episode,
      airingAt: e.media.nextAiringEpisode.airingAt,
      coverImage: e.media.coverImage.medium
    }))

  // remove duplicates
  episodes = episodes.filter(
    (item, index, self) =>
      index === self.findIndex(
        t =>
          t.title === item.title &&
          t.episode === item.episode
      )
  )

  res.setHeader("Cache-Control", "s-maxage=3600")

  res.status(200).json(episodes)
}
