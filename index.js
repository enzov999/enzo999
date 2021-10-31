require("dotenv").config();
const Discord = require("discord.js");
const client = new Discord.Client({ intents: ['GUILDS', 'GUILD_MESSAGES']});
client.manager = require("./manager")(client);

client.login("token");     

client.on("ready", () => {
  console.log("estoy listo.");
  client.manager.init(client.user.id);
});

client.on("raw", (d) => client.manager.updateVoiceState(d));

client.on("message", async (message) => {
  if (message.content.startsWith("!play")) {
    const res = await client.manager.search(
      message.content.slice(6),
      message.author
    );
    // Creacion lista de Audio
    const player = client.manager.create({
      guild: message.guild.id,
      voiceChannel: message.member.voice.channel.id,
      textChannel: message.channel.id,
    });
    // Conectar al canal de voz
    player.connect();

    // Lista de Audio
    player.queue.add(res.tracks[0]);
    message.channel.send(`En cola ${res.tracks[0].title}.`);

    // Empezar lista de Audio
    if (!player.playing && !player.paused && !player.queue.size) player.play();
  } else if (message.content === "!skip") { // Comando para saltear cancion
    const player = client.manager.players.get(message.guild.id);
    console.log(player);
    player.stop();
  } else if (message.content === "!pause") { // Comando para poner pausa
    const player = client.manager.players.get(message.guild.id);
    if (player.paused) {
      player.pause(false); // Sacar pausa
      message.channel.send("Lista de Audio sin pausa");
    } else {
      player.pause(true); // Poner pausa
      message.channel.send("Lista de Audio en pausa");
    }
  } else if (message.content === "!loop") { //Comando modo bucle
    const player = client.manager.players.get(message.guild.id);
    if (player.queueRepeat) { // Desactivar modo bucle
      player.setQueueRepeat(false);
      message.channel.send("Lista de audio en modo normal");
    } else {
      player.setQueueRepeat(true); //Activar modo bucle
      message.channel.send("Lista de audio en modo bucle");
    }
  } else if (message.content.startsWith("!search")) { //Comando para buscar una determinada cancion
    const index = message.content.indexOf(" ");
    const query = message.content.slice(index + 1);
    const results = await client.manager.search(query, message.author);
    const tracks = results.tracks.slice(0, 10);
    let resultsDescription = "";
    let counter = 1;
    for (const track of tracks) {
      resultsDescription += `${counter}) [${track.title}](${track.uri})\n`;
      counter++;
    }
    const embed = new MessageEmbed().setDescription(resultsDescription);
    message.channel.send(
      "Que cancion es la que quieres? Ingresa el numero", 
      embed
    );
    const response = await message.channel.awaitMessages(
      (msg) => msg.author.id === message.author.id,
      {
        max: 1,
        time: 30000,
      }
    );
    const answer = response.first().content;
    const track = tracks[answer - 1];
    console.log(track);
    const player = client.manager.players.get(message.guild.id);
    if (player) {
      player.queue.add(track);
      message.channel.send(`${track.title} Musica agregada a lista de Audio.`);
    } else {
      message.channel.send(
        "No hay usuarios en el canal de voz o el bot no esta en el canal de voz."
      );
    }
  }
});



