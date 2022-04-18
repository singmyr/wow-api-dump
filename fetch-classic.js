import fetch from 'node-fetch'
import fs from 'fs'

const accessToken = process.env.BLIZZARD_ACCESS_TOKEN

if (!accessToken) {
    console.error("Error: Missing access token: BLIZZARD_ACCESS_TOKEN")
    process.exit(1)
}

// This one is currently not being used.
const itemSearchPattern = "https://eu.api.blizzard.com/data/wow/search/item?namespace=static-classic-eu&locale=en_GB&orderby=id&id=[{minID},]&_pageSize=1000&_page=1&access_token=" + accessToken
const itemInfoPattern = "https://eu.api.blizzard.com/data/wow/item/{itemID}?namespace=static-classic-eu&locale=en_GB&access_token=" + accessToken
const itemMediaPattern = "https://eu.api.blizzard.com/data/wow/media/item/{itemID}?namespace=static-classic-eu&locale=en_GB&access_token=" + accessToken
let minID = 1

let itemIDs = []
try {
    itemIDs = JSON.parse(fs.readFileSync('itemIDs.json').toString())
} catch(e) {
    console.log("No itemIDs.json file found, starting fresh!")

    let fetchMore = true;
    do {
        process.stdout.write("- Fetching item IDs: " + minID + "-" + (minID+999) + "\r")
        let data = await fetch(itemSearchPattern.replace("{minID}", minID)).then(r => r.json())
        data.results.forEach(i => {
            itemIDs.push(i.data.id)
        })
        minID += 1000
        fetchMore = data.pageSize === data.maxPageSize
    } while(fetchMore);

    // After we've fetched every item ID, write it to itemIDs.json.
    // Make sure the results are unique, no need for duplicated.
    itemIDs = itemIDs.filter((v, i, self) => self.indexOf(v) === i)
    fs.writeFileSync('itemIDs.json', JSON.stringify(itemIDs), { flag: 'w'})
    process.stdout.clearLine()
    process.stdout.write("Fetch complete.\n")
}

let result = {}

try {
    result = JSON.parse(fs.readFileSync('items.json').toString())
} catch(e) {
    itemIDs.forEach(i => {
        if (!!i) {
            result[i] = {
                info: null,
                media: null
            }
        }
    })
}


// Calculate current status.
const max = Object.keys(result).length * 2
let current = 0;
for (const key in result) {
    if (result.hasOwnProperty(key)) {
        result[key].info != null && current++
        result[key].media != null && current++
    }
}

process.stdout.write("- " + current + " / " + max + "\r")

const sleep = ms => new Promise(r => setTimeout(r, ms))

let keepGoing = true;
while (keepGoing) {
    try {
        for (const key in result) {
            if (result.hasOwnProperty(key)) {
                if (result[key].info == null || result[key].media == null) {
                    if (result[key].info == null) {
                        result[key].info = await fetch(itemInfoPattern.replace('{itemID}', key)).then(r => r.json())
                        current++
                    }
                    if (result[key].media == null) {
                        result[key].media = await fetch(itemMediaPattern.replace('{itemID}', key)).then(r => r.json())
                        current++
                    }
                    process.stdout.write("- " + current + " / " + max + "\r")
                    await sleep(100)
                }
            }
        }
    } catch (e) {
        if (e.code == 'ETIMEDOUT') {
            fs.writeFileSync('items.json', JSON.stringify(result), { flag: 'w'})
        } else {
            console.error(e)
            keepGoing = false
        }
    }

    if (current == max) {
        keepGoing = false
    }
}

// Wherever we are at the end, write so we can pickup where we left of.
fs.writeFileSync('items.json', JSON.stringify(result), { flag: 'w'})
