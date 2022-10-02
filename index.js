const puppeteer = require("puppeteer");
const fs = require("fs");
const { default: axios } = require("axios");
process.setMaxListeners(50000000000000);
let URL = "https://.....";
let newSize = 0;
(async () => {
  console.log("URL :: ", URL);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await fs.promises.mkdir("images");
  await page.goto(URL, { waitUntil: "networkidle0", timeout: 5000000 });
  await page.waitForSelector("body");
  const currentPage = await page.evaluate(() => {
    let AV_Exists = false;
    const autoPlayItems = document.querySelectorAll(
      "video[autoplay], audio[autoplay]"
    );
    if (autoPlayItems.length > 0) {
      AV_Exists = true;
    }
    const youtubeIframes = document.querySelectorAll("iframe");
    youtubeIframes.forEach((iframe) => {
      if (iframe.attributes.src.nodeValue.includes("youtube")) {
        AV_Exists = true;
      }
    });
    if (document.querySelectorAll("video, audio").length > 0) {
      AV_Exists = true;
    }
    return {
      images: Array.from(document.images, (e) => e.src),
      AV_Exists,
    };
  });

  const { images, AV_Exists } = currentPage;
  const downloadFaild = await startDownload(images);
  await calculations();
  await browser.close();
  await removeImages();
  console.log(
    `successfully reduced the size of ${images.length - downloadFaild} images`
  );
  await getAfter(AV_Exists, newSize);
})();
async function download(uri, filename) {
  const writer = fs.createWriteStream(`images/${filename}`);

  return axios({
    method: "get",
    url: uri,
    responseType: "stream",
  }).then((response) => {
    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      let error = null;
      writer.on("error", (err) => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on("close", () => {
        if (!error) {
          resolve(true);
        }
      });
    });
  });
}

// the equation of reduce image Size
function reduceSize(fileSize) {
  return fileSize * (35 / 100);
}
async function getAfter(AV_Exists, reducedSize) {
  try {
    const res = await axios.get(
      `https://api.websitecarbon.com/site?url=${URL}`
    );
    const before = 7220712; //res.data.bytes;
    console.log("before =", before);
    console.log("reduced =", reducedSize);
    if (AV_Exists) {
      const after = (before - reducedSize) * (15 / 100);
      console.log("After = ", after);
      console.log(
        `successfully included the video/s or Audio/s in the calculation`
      );
    } else {
      const after = (before - reducedSize) * (10 / 100);
      console.log("After = ", after);
    }
  } catch (error) {
    console.log(
      "websitecarbon: Service temporarily unavailable.",
      error.message
    );
  }
}
async function startDownload(images) {
  let downloadFaild = 0;
  for (let i = 0; i < images.length; i++) {
    try {
      if (images[i].includes("png")) {
        await download(images[i], `image-${i}.png`);
      } else if (images[i].includes("gif")) {
        await download(images[i], `image-${i}.gif`);
      } else {
        await download(images[i], `image-${i}.jpg`);
      }
    } catch (error) {
      console.log("This images Failed to download ", images[i]);
      downloadFaild++;
    }
  }
  return downloadFaild;
}
async function removeImages() {
  await fs.promises.rm("images", { recursive: true });
}
async function calculations() {
  const files = await fs.promises.readdir("images");
  console.log(files);
  files.forEach(async (file) => {
    fs.stat(`images/${file}`, (err, stats) => {
      if (err) {
        console.log("error::", err);
      } else {
        newSize += reduceSize(stats.size);
      }
    });
  });
}
// end function calculations
