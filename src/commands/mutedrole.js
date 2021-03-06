exports.run = async (client, message, args) => {

  const settings = message.settings;

  if (!client.settings.has(message.guild.id)) {
    client.settings.set(message.guild.id, {});
  }

  var mutedRole = message.guild.roles.cache.get(settings.mutedRole)

  if (!args[0]) {
    if(!mutedRole) {
      return message.channel.send(
        "<:error:466995152976871434> There is no muted role set for this server. Please set one using `" + message.settings.prefix + "mutedrole <role>`"
        )
    } else {
    message.channel.send(`The current muted role is: \`${mutedRole.name}\``)
    }

  } else {
    const joinedValue = args.join(" ");
    if (joinedValue.length < 1) {
      return message.channel.send(
        `<:error:466995152976871434> You didn't specify a role. Usage: \`${client.commands.get(`mutedrole`).help.usage}\``
        );
    };
    
    if (settings.mutedRole != "None set" && joinedValue === mutedRole.name) {
      return message.channel.send(
        "<:error:466995152976871434> The muted role is already set to that!"
        );
    };

    let role = client.findRole(joinedValue, message);

    if (!role) {
      return message.channel.send(`<:error:466995152976871434> That role doesn't seem to exist. Try again!`);
    };

    client.settings.set(message.guild.id, role.id, "mutedRole");
    
    message.channel.send(
      `<:success:466995111885144095> The muted role has been set to \`${role.name}\`
      `);
  };
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [],
  permLevel: "Administrator",
  requiredPerms: []
};

exports.help = {
  name: "mutedrole",
  category: "Configure",
  description: "Sets the muted role for this server.",
  usage: "mutedrole [role]"
};
