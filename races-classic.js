import fetch from 'node-fetch'

const accessToken = process.env.BLIZZARD_ACCESS_TOKEN

if (!accessToken) {
    console.error("Error: Missing access token: BLIZZARD_ACCESS_TOKEN")
    process.exit(1)
}

const raceIndex = "https://eu.api.blizzard.com/data/wow/playable-race/index?namespace=static-classic-eu&locale=en_GB&access_token=" + accessToken

const racePattern = "https://eu.api.blizzard.com/data/wow/playable-race/{ID}?namespace=static-classic-eu&locale=en_GB&access_token=" + accessToken

let races = []

let data = await fetch(raceIndex).then(r => r.json())
for (let i = 0; i < data.races.length; i++) {
    const c = data.races[i];
    const raceID = c.id
    const d = {
        id: raceID,
        name: c.name,
        faction: null,
    }
    // Skip this, doesn't give any information we need
    const rData = await fetch(racePattern.replace("{ID}", raceID)).then(r => r.json())
    
    d.faction = rData.faction.type

    races.push(d)
}

// Export to CSV.
console.log("ID;Name;Faction")

races.forEach(c => {
    console.log(c.id + ";" + c.name + ";" + c.faction)
})