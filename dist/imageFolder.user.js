// ==UserScript==
// @name        imageFolder
// @description Navigate to parent folder
// @namespace   https://github.com/smegmarip
// @version     0.0.2
// @homepage    https://github.com/smegmarip/stash-image-folder/
// @author      smegmarip
// @match       http://localhost:9999/*
// @connect     localhost
// @run-at      document-idle
// @require     https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/master/src/StashUserscriptLibrary.js
// @downloadURL https://raw.githubusercontent.com/smegmarip/stash-image-folder/main/dist/imageFolder.user.js
// @updateURL   https://raw.githubusercontent.com/smegmarip/stash-image-folder/main/dist/imageFolder.user.js
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// ==/UserScript==
(function () {
  "use strict";

  const { stash: stash$1 } = unsafeWindow.stash;

  function rawurlencode(str) {
    str = str + "";
    return encodeURIComponent(str)
      .replace(/!/g, "%21")
      .replace(/'/g, "%27")
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29")
      .replace(/\*/g, "%2A");
  }

  function directory(filePath) {
    // Replace backslashes with forward slashes for consistency
    let normalizedPath = filePath.replace(/\\/g, "/");
    // Extract the directory part
    return normalizedPath.substring(0, normalizedPath.lastIndexOf("/"));
  }

  function waitForElm(selector) {
    return new Promise((resolve) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver((mutations) => {
        if (document.querySelector(selector)) {
          resolve(document.querySelector(selector));
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  /**
   * Returns an array containing the scenario and scenario ID extracted from the current URL.
   * @returns {Array<string>} An array containing the scenario and scenario ID.
   */
  function getScenarioAndID() {
    var result = document.URL.match(/(scenes|images)\/(\d+)/);
    var scenario = result[1];
    var scenario_id = result[2];
    return [scenario, scenario_id];
  }

  /**
   * Retrieves the path for a given image ID.
   *
   * @param {number} image_id - The ID of the image to retrieve the path for.
   * @returns {Promise<string|null>} - A Promise that resolves with the image path if it exists, or null if it does not.
   */
  async function getImagePath(image_id) {
    const reqData = {
      query: `{
        findImage(id: ${image_id}){
          path
        }
      }`,
    };
    var result = await stash$1.callGQL(reqData);
    const path = result.data.findImage.path;
    if (path) {
      return path;
    } else {
      return null;
    }
  }

  /**
   * Retrieves the path for a given Scene ID.
   *
   * @param {number} scene_id - The ID of the scene to retrieve the path for.
   * @returns {Promise<string|null>} - A Promise that resolves with the scene path if it exists, or null if it does not.
   */
  async function getScenePath(scene_id) {
    const reqData = {
      query: `{
        findScene(id: ${scene_id}){
          files {
            path
          }
        }
      }`,
    };
    var result = await stash$1.callGQL(reqData);
    if (!result.data.findScene || result.data.findScene.files.length == 0) {
      return null;
    }

    const path = result.data.findScene.files[0].path;
    if (path) {
      return path;
    } else {
      return null;
    }
  }

  function processImage() {
    let btnGrp = ".ml-auto .btn-group";
    let wrapper = ".image-container";
    waitForElm(wrapper).then(async ($el) => {
      const [_, image_id] = getScenarioAndID();
      const imagePath = await getImagePath(image_id);
      if (imagePath) {
        waitForElm(btnGrp).then(async ($btnGrpEl) => {
          if (!document.querySelector("#parentFolder")) {
            const btn = document.createElement("button");
            btn.setAttribute("id", "parentFolder");
            btn.setAttribute("class", "minimal pr-1 btn btn-secondary");
            const spn = document.createElement("span");
            const svg = `<svg fill="#FFFFFF" height="16" width="16" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path class="cls-1" d="M12,10V7H8V5H9V2H6V5H7V7H3v3H2v3H5V10H4V8H7v2H6v3H9V10H8V8h3v2H10v3h3V10ZM7,4V3H8V4Z"/></svg>`;
            spn.innerHTML = svg;
            btn.appendChild(spn);
            $btnGrpEl.prepend(btn);
            btn.addEventListener("click", function () {
              const parentPath = rawurlencode(
                directory(imagePath.replace(/^file:\/\//i, ""))
              );
              window.location.href = `/images?c=("type":"path","value":"%5C"${parentPath}%5C"","modifier":"INCLUDES")&sortby=updated_at&sortdir=desc&perPage=250`;
              return;
            });
          }
        });
      } else {
        const btn = document.querySelector("#parentFolder");
        if (btn) {
          btn.remove();
        }
      }
    });
  }

  function processScene() {
    let btnGrp = ".ml-auto .btn-group";
    let wrapper = ".VideoPlayer .video-wrapper";
    waitForElm(wrapper).then(async ($el) => {
      const [_, scene_id] = getScenarioAndID();
      const scenePath = await getScenePath(scene_id);
      if (scenePath) {
        waitForElm(btnGrp).then(async ($btnGrpEl) => {
          if (!document.querySelector("#parentFolder")) {
            const btn = document.createElement("button");
            btn.setAttribute("id", "parentFolder");
            btn.setAttribute("class", "minimal pr-1 btn btn-secondary");
            const spn = document.createElement("span");
            const svg = `<svg fill="#FFFFFF" height="16" width="16" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path class="cls-1" d="M12,10V7H8V5H9V2H6V5H7V7H3v3H2v3H5V10H4V8H7v2H6v3H9V10H8V8h3v2H10v3h3V10ZM7,4V3H8V4Z"/></svg>`;
            spn.innerHTML = svg;
            btn.appendChild(spn);
            $btnGrpEl.prepend(btn);
            btn.addEventListener("click", function () {
              const parentPath = rawurlencode(
                directory(scenePath.replace(/^file:\/\//i, ""))
              );
              window.location.href = `/scenes?c=("type":"path","value":"%5C"${parentPath}%5C"","modifier":"INCLUDES")&sortby=updated_at&sortdir=desc&perPage=250`;
              return;
            });
          }
        });
      } else {
        const btn = document.querySelector("#parentFolder");
        if (btn) {
          btn.remove();
        }
      }
    });
  }

  const { stash } = unsafeWindow.stash;
  stash.addEventListener("page:image", processImage);
  stash.addEventListener("page:scene", processScene);
})();
