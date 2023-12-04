let titleInput = document.getElementById("title-input");
let urlInput = document.getElementById("url-input");
var button = document.getElementById("submit");
let tempFavIconUrl;
let cardList;

titleInput?.addEventListener(
  "keyup",
  (e) => (titleInput.value = e.target.value)
);
urlInput?.addEventListener("keyup", (e) => (urlInput.value = e.target.value));

document.addEventListener("DOMContentLoaded", async () => {
  const { title, url, favIconUrl } = await getCurrentTab();

  titleInput.value = title;
  urlInput.value = url;

  cardList = fetchData();
  const newTabs = await getNewTab();

  button.addEventListener("click", (e) => {
    if (cardList.length < 20) {
      convertImgUrlToBase64(favIconUrl, async (convertedImg) => {
        await updateCards(titleInput.value, urlInput.value, convertedImg);
        if (newTabs && typeof newTabs === "object") {
          for (let i = 0; i < newTabs.length; i++) {
            await chrome.tabs.reload(newTabs[i].id);
          }
        }
        window.close();
      });
    } else {
      alert("maxed capacity of cards");
      window.close();
    }
  });
});

async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  if (tab.url === "edge://newtab/") {
    return { title: "", url: "", favIconUrl: "" };
  }
  return tab;
}

async function getNewTab() {
  let queryOptions = { url: "edge://newtab/" };
  let tabs = await chrome.tabs.query(queryOptions);
  return tabs;
}

const updateCards = async (title, url, logo) => {
  cardList.push({
    title,
    url,
    logo,
    color: "rgba(58, 58, 58, 0.425)",
    position: cardList ? cardList.length : 0,
  });
  localStorage.setItem("cards", JSON.stringify(cardList));
};
