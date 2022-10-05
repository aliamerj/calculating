const puppeteer = require("puppeteer");
const fs = require("fs");
const downloadingImage = require("image-downloader");
const { default: axios } = require("axios");
const path = require("path");
process.setMaxListeners(50000000000000);
let URL = "https://.....";
let newSize = 0;
(async () => {
  console.log("URL :: ", URL);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await fs.promises.mkdir("images");
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 50000000 });
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
  await startDownload(images);
  await calculations();
  await removeImages();
  await browser.close();
  console.log(`successfully reduced the size of ${images.length} images`);
  await getAfter(AV_Exists, newSize);
})();

// the equation of reduce image Size
function reduceSize(fileSize) {
  return fileSize * (35 / 100);
}
async function getAfter(AV_Exists, reducedSize) {
  try {
    // const res = await axios.get(
    //   `https://api.websitecarbon.com/site?url=${URL}`
    // );
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
  const dest = path.join(__dirname, "images");
  for (let i = 0; i < images.length; i++) {
    downloadingImage
      .image({ url: images[i], dest, extractFilename: true })
      .then((dd) => {
        console.log("Saved to", dd);
      })
      .catch((err) => console.log("err", err));
  }
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
