require("dotenv").config();
const { Client, GatewayIntentBits, EmbedsBuilder } = require("discord.js");
const axios = require("axios");

// env config
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
let lastCommitSHA = "";

//config client's Discord

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

//Function to check if new there is new commits in the repository
async function checkForNewCommits() {
  try {
    // Fetch the latest commit from the GitHub API
    console.log(
      `Próba pobrania commitów z: https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits`
    );

    const response = await axios.get(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      }
    );

    // Get the latest commit
    const latestCommit = response.data[0];

    // save the latest commit hash to a file or database
    if (!lastCommitSHA) {
      lastCommitSHA = latestCommit.sha;
      console.log("First commit saved:", lastCommitSHA);
      return;
    }
    //check if there is a new commit
    if (latestCommit.sha !== lastCommitSHA) {
      console.log("New commit found");

      // Send a message to the Discord channel
      const channel = client.channels.cache.get(DISCORD_CHANNEL_ID);

      if (channel) {
        const embed = new EmbedsBuilder()
          .setTitle(`New Commmit on GitHub repository ${GITHUB_REPO}`)
          .setDescription(latestCommit.commit.message)
          .setColor(0x0099ff)
          .addFields(
            {
              name: "Committer",
              value: latestCommit.commit.committer.name,
              inline: true,
            },
            {
              name: "Date",
              value: latestCommit.commit.committer.date,
              inline: true,
            },
            {
              name: "Repository",
              value: "${GITHUB_OWNER}/${GITHUB_REPO}",
              inline: true,
            }
          )
          .setURL(latestCommit.html_url)
          .setTimestamp();

        // Send the embed message to the channel
        channel.send({ embeds: [embed] });
        console.log("Message sent to Discord channel");
      }

      lastCommitSHA = latestCommit.sha;
    }
  } catch (error) {
    console.error("Error fetching commits:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

// Check if bot is ready
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);

  //test if bot sending messages

  // check commits just after run
  checkForNewCommits();

  // check for new commits every 5 minutes
  setInterval(checkForNewCommits, 5 * 60 * 1000);
});

// login bot

client.login(process.env.DISCORD_TOKEN);
