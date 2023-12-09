let titleInput = document.getElementById("title-input");
let urlInput = document.getElementById("url-input");
let selectFolderDropdown = document.getElementById("select-folder");
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
  cardList = fetchData("cards");
  createOptions(cardList)

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

const createOptions = (cardList) => {
  const filteredList = cardList.filter(card => card.type === "folder")

  for (let item of filteredList) {
    console.log(item)
    const newOption = createOption(item)

    selectFolderDropdown.appendChild(newOption)
  }
}

const createOption = (item) => {
  const newOption = document.createElement("option")
  newOption.setAttribute("value", item.position);
  console.log(item.cards.length === 8 ? "true" : "false")
  newOption.disabled = item.cards.length === 8;
  newOption.innerText = toCamelCase(item.name)
  return newOption
}

const updateCards = async (title, url, logo) => {
  const selectFolderPos = Number(selectFolderDropdown.value)
  const newCardData = {
    title,
    url,
    logo,
    color: "rgba(58, 58, 58, 0.425)",
    position: cardList.length ? selectFolderPos ? cardList[selectFolderPos].cards.length : cardList.length : 0,
  }
  if (selectFolderPos) {
    cardList = cardList.map(card => {
      if (card.type === "folder" && card.position === selectFolderPos) {
        card.cards.push(newCardData)
        return {
          ...card,
          cards: card.cards
        }
      } else {
        return card
      }
    })
  } else {
    cardList.push(newCardData);
  }

  localStorage.setItem("cards", JSON.stringify(cardList));
};

const toCamelCase = (inputString) => {
  // Remove non-alphanumeric characters and split the string into words
  const words = inputString.replace(/[^a-zA-Z0-9]/g, ' ').split(' ');

  // Capitalize the first letter of each word (except the first word)
  const camelCaseWords = words.map((word, index) => {
    if (index === 0) {
      return word.toLowerCase();
    } else {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
  });

  // Join the words to form the camel case string
  const camelCaseString = camelCaseWords.join(' ');

  return camelCaseString;
}
