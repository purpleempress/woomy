const ytdl = require('ytdl-core-discord')
const fetch = require('node-fetch')
const { MessageEmbed } = require('discord.js')

module.exports = client => {
  client.music = { guilds: {} }

  // MUSIC - TIMESTAMP
  client.createTimestamp = function (duration) {
    var hrs = ~~(duration / 60 / 60)
    var min = ~~(duration / 60) % 60
    var sec = ~~(duration - min * 60)

    if (String(hrs).length < 2) {
      hrs = '0' + String(hrs) + ':'
    }

    if (String(min).length < 2) {
      min = '0' + String(min)
    }

    if (String(sec).length < 2) {
      sec = '0' + String(sec)
    }

    if (hrs === '00:') {
      hrs = ''
    }

    var time = hrs + min + ':' + sec
    return time
  }

  client.music.getGuild = function (id) {
    let guild = client.music.guilds[id]

    if (!guild) {
      guild = {}

      guild.dispatcher = null
      guild.playing = false
      guild.queue = []

      client.music.guilds[id] = guild
    }

    return guild
  }

  client.music.getLinkFromID = function (id) {
    return 'https://www.youtube.com/watch?v=' + id
  }

  client.music.getVideoByQuery = async query => {
    let resp

    try {
      const id = await ytdl.getURLVideoID(query)
      resp = await fetch('https://invidio.us/api/v1/videos/' + id)
      console.log(resp)
    } catch (err) {
      resp = await fetch('https://invidio.us/api/v1/search?q=' + encodeURIComponent(query))
    }

    const parsed = await resp.json()

    if (parsed) {
      const videos = parsed

      if (videos) {
        return videos
      } else {
        return false
      }
    } else {
      return false
    }
  }

  client.music.play = async function (message, query, ignoreQueue) {
    const guild = client.music.getGuild(message.guild.id)

    if (!message.member.voice.channel && !guild.voiceChannel) {
      return message.reply('you are not in a voice channel!')
    }

    const vc = message.member.voice.channel

    let video
    let videos

    if (!ignoreQueue) {
      videos = await client.music.getVideoByQuery(query)
      if (!videos[1]) {
        if (!videos[0]) {
          video = videos
        } else {
          video = videos[0]
        }
      }
    }

    if (videos || ignoreQueue) {
      if (!ignoreQueue) {
        // Fix the bot if  somehow broken
        // music "playing", nothing in queue
        if ((guild.playing || guild.dispatcher) && guild.queue.length === 0) {
          guild.playing = false
          guild.dispatcher = null
        // music not playing, something is in queue
        } else if (!guild.playing && !guild.dispatcher && guild.queue.length > 0) {
          guild.queue = []
        }

        if (!video) {
          let output = ''
          let i = 0
          for (i = 0; i < 5; i++) {
            if (!videos[i]) break
            output += `\`${i + 1}:\` **[${videos[i].title}](https://www.youtube.com/watch?v=${videos[i].videoId})** \`[${client.createTimestamp(videos[i].lengthSeconds)}]\`\n`
          }

          const embed = new MessageEmbed()
          embed.setTitle('Please reply with a number `1-' + i + '` to select which song you want to add to the queue.')
          embed.setColor(client.embedColour(message.guild))
          embed.setDescription(output)
          const selection = await client.awaitReply(message, embed)
          console.log(selection)

          switch (selection) {

          }
        }

        if (!video && videos[0]) {
          video = videos[0]
        } else if (!video) {
          video = videos
        }

        console.log(video)

        // Add video to queue
        guild.queue.push({ video: video, requestedBy: message.member.id })
      }

      // Figure out if  the bot should add it to queue or play it right now
      if (guild.playing) {
        message.reply('added **' + video.title + '** to the queue')
      } else {
        guild.playing = true

        guild.voiceChannel = vc

        const connection = await vc.join()

        const v = guild.queue[0]

        guild.dispatcher = connection.play(await ytdl(client.music.getLinkFromID(v.video.videoId), { highWaterMark: 1024 * 1024 * 32 }), { type: 'opus' })
        guild.dispatcher.setVolume(0.25)

        message.channel.send('Playing **' + v.video.title + '**')

        // play next in queue on end
        guild.dispatcher.once('finish', () => {
          guild.queue.shift()
          guild.playing = false

          if (guild.queue.length > 0) {
            client.music.play(message, null, true)
          } else {
            guild.dispatcher = null

            connection.disconnect()
          }
        })
      }
    } else {
      return message.reply('failed to find the video!')
    }
  }

  client.music.setVolume = function (guild, target) {
    const g = client.music.getGuild(guild.id)

    if (g.dispatcher) {
      g.dispatcher.setVolume(target)
    }
  }

  client.music.skip = function (guild, reason) {
    const g = client.music.getGuild(guild.id)

    if (g.dispatcher) {
      g.dispatcher.end(reason)
    }
  }
}