module.exports = client => {
  client.permlevel = message => {
    let permlvl = 0

    const permOrder = client.config.permLevels.slice(0).sort((p, c) => p.level < c.level ? 1 : -1)

    while (permOrder.length) {
      const currentLevel = permOrder.shift()
      if (message.guild && currentLevel.guildOnly) continue
      if (currentLevel.check(message)) {
        permlvl = currentLevel.level
        break
      }
    }
    return permlvl
  }

  client.loadCommand = (commandName) => {
    try {
      const props = require(`../commands/${commandName}`)
      if (props.init) {
        props.init(client)
      }
      client.commands.set(props.help.name, props)
      // So commands can each have their own cooldown time
      client.cooldown.set(props.help.name, new Map())
      props.conf.aliases.forEach(alias => {
        client.aliases.set(alias, props.help.name)
      })
      return false
    } catch (e) {
      return `Failed to load ${commandName}: ${e}`
    }
  }

  client.unloadCommand = async (commandName) => {
    let command
    if (client.commands.has(commandName)) {
      command = client.commands.get(commandName)
    } else if (client.aliases.has(commandName)) {
      command = client.commands.get(client.aliases.get(commandName))
    }
    if (!command) return `The command \`${commandName}\` doesn't seem to exist, nor is it an alias. Try again!`

    if (command.shutdown) {
      await command.shutdown(client)
    }
    const mod = require.cache[require.resolve(`../commands/${command.help.name}`)]
    delete require.cache[require.resolve(`../commands/${command.help.name}.js`)]
    for (let i = 0; i < mod.parent.children.length; i++) {
      if (mod.parent.children[i] === mod) {
        mod.parent.children.splice(i, 1)
        break
      }
    }
    return false
  }

  client.clean = async (client, text) => {
    if (text && text.constructor.name === 'Promise') {
      text = await text
    }
    if (typeof text !== 'string') {
      text = require('util').inspect(text, { depth: 1 })
    }
    text = text
      .replace(/`/g, '`' + String.fromCharCode(8203))
      .replace(/@/g, '@' + String.fromCharCode(8203))
      .replace(client.token, 'mfa.VkO_2G4Qv3T--NO--lWetW_tjND--TOKEN--QFTm6YGtzq9PH--4U--tG0')

    return text
  }

  client.getMembers = function (guild, query) {
    if (!query) return
    query = query.toLowerCase()

    var a = []
    var b

    // MAKE IT SO IT CAN TAKE AN ID

    try {
      b = guild.members.cache.find(x => x.displayName.toLowerCase() === query)
      if (!b) guild.members.cache.find(x => x.user.username.toLowerCase() === query)
    } catch (err) {}
    if (b) a.push(b)
    guild.members.cache.forEach(member => {
      if (
        (member.displayName.toLowerCase().startsWith(query) ||
          member.user.tag.toLowerCase().startsWith(query)) &&
        member.id !== (b && b.id)
      ) {
        a.push(member)
      }
    })
    return a
  }

  client.getMembers = function (guild, query) {
    if (!query || typeof query !== 'string') return

    const members = []

    // Try ID search
    if (!isNaN(query) === true) {
      members.push(guild.members.cache.get(query))
      if (members[0]) {
        return members[0]
      }
    }

    // Try username search
    try {
      guild.members.cache.forEach(m => {
        if (m.displayName.toLowerCase().startsWith(query) || m.user.tag.toLowerCase.startsWith(query)) {
          members.push(m)
          console.log(m)
        }
      })

      return members
    } catch (err) {}
  }

  // Both of these functions catch errors and log them
  process.on('uncaughtException', (err) => {
    const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, 'g'), './')
    client.logger.fatal(`Uncaught Exception: ${errorMsg}`)
    process.exit(1)
  })

  process.on('unhandledRejection', err => {
    client.logger.error(`Unhandled rejection: ${err}`)
  })
}
