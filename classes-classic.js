import fetch from 'node-fetch'

const accessToken = process.env.BLIZZARD_ACCESS_TOKEN

if (!accessToken) {
    console.error("Error: Missing access token: BLIZZARD_ACCESS_TOKEN")
    process.exit(1)
}

const classIndex = "https://eu.api.blizzard.com/data/wow/playable-class/index?namespace=static-classic-eu&locale=en_GB&access_token=" + accessToken

const classPattern = "https://eu.api.blizzard.com/data/wow/playable-class/{ID}?namespace=static-classic-eu&locale=en_GB&access_token=" + accessToken
const mediaPattern = "https://eu.api.blizzard.com/data/wow/media/playable-class/{ID}?namespace=static-classic-eu&locale=en_GB&access_token=" + accessToken

let classes = []

let data = await fetch(classIndex).then(r => r.json())
for (let i = 0; i < data.classes.length; i++) {
    const c = data.classes[i];
    const classID = c.id
    const d = {
        id: classID,
        name: c.name,
        image: null,
    }
    // Skip this, doesn't give any information we need
    // const cData = await fetch(classPattern.replace("{ID}", classID)).then(r => r.json())
    const mData = await fetch(mediaPattern.replace("{ID}", classID)).then(r => r.json())

    if (mData.assets && mData.assets.length > 0) {
        d.image = mData.assets[0].value
    }

    classes.push(d)
}

// Export to CSV.
console.log("ID;Name;Icon")

classes.forEach(c => {
    console.log(c.id + ";" + c.name + ";" + c.image)
})