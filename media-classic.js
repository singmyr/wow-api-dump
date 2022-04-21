import fetch from 'node-fetch'
import fs from 'fs'

const accessToken = process.env.BLIZZARD_ACCESS_TOKEN

if (!accessToken) {
    console.error("Error: Missing access token: BLIZZARD_ACCESS_TOKEN")
    process.exit(1)
}

const mediaSearchPattern = "https://eu.api.blizzard.com/data/wow/search/media?namespace=static-classic-eu&orderby=id&id=[{minID},]&_pageSize=1000&_page=1&access_token=" + accessToken
let minID = 0

let media = []

let fetchMore = true;
do {
    let highestID = 0;
    let data = await fetch(mediaSearchPattern.replace("{minID}", minID)).then(r => r.json())
    data.results.forEach(i => {
        media.push(i.data)
        if (i.data.id > highestID) {
            highestID = i.data.id
        }
    })
    minID = highestID
    fetchMore = data.pageSize === data.maxPageSize
} while(fetchMore);
console.log(JSON.stringify(media))