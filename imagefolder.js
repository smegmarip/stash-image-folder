(function () {
  "use strict";

  const csLib = window.csLib;
  const IMAGE_TARGET_SELECTOR = ".image-toolbar-group:nth-child(2)";
  const SCENE_TARGET_SELECTOR = ".scene-toolbar-group:nth-child(2)";

  /**
   * The rawurlencode function encodes a string to be used in a URL.
   *
   *
   * @param str Specify the string to be encoded
   *
   * @return A string in which all non-alphanumeric characters except -_
   */
  function rawurlencode(str) {
    str = str + "";
    return encodeURIComponent(str)
      .replace(/!/g, "%21")
      .replace(/'/g, "%27")
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29")
      .replace(/\*/g, "%2A");
  }

  /**
   * The directory function takes a file path and returns the directory part of it.
   *
   *
   * @param filePath Specify the path of the file
   * @deprecated Use getParentImagePath instead.
   *
   * @return The directory part of a file path
   */
  function directory(filePath) {
    // Replace backslashes with forward slashes for consistency
    let normalizedPath = filePath.replace(/\\/g, "/");
    // Extract the directory part
    return normalizedPath.substring(0, normalizedPath.lastIndexOf("/"));
  }

  /**
   * Adds a trailing slash to the given path if it doesn't already have one.
   *
   * @param path The path to which a trailing slash should be added
   *
   * @return The path with a trailing slash
   */
  function addTrailingSlash(path) {
    if (!path.endsWith("/")) {
      return path + "/";
    }
    return path;
  }

  /**
   * The waitForElm function returns a Promise that resolves when the selector is found in the DOM.
   *
   *
   * @param selector Select the element we want to wait for
   *
   * @return A promise that resolves with the element when it exists
   */
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
   * Retrieves the path for the parent of a given image ID.
   *
   * @param {number} image_id - The ID of the image to retrieve the path for.
   * @returns {Promise<string|null>} - A Promise that resolves with the parent image path if it exists, or null if it does not.
   */
  async function getParentImagePath(image_id) {
    const reqData = {
      query: `{
          findImage(id: ${image_id}){
            visual_files {
              ... on VideoFile {
                id
                path
                parent_folder {
                  path
                }
              }
              ... on ImageFile {
                id
                parent_folder {
                  path
                }
              }
            }
          }
        }`,
    };
    var result = await csLib.callGQL(reqData);
    const visual_files = result.findImage.visual_files;

    if (
      visual_files &&
      Array.isArray(visual_files) &&
      visual_files.length > 0
    ) {
      for (const file of visual_files) {
        if (file.parent_folder && file.parent_folder.path) {
          return file.parent_folder.path;
        }
      }
      return null;
    } else {
      return null;
    }
  }

  /**
   * Retrieves the path for the parent of a given Scene ID.
   *
   * @param {number} scene_id - The ID of the scene to retrieve the path for.
   * @returns {Promise<string|null>} - A Promise that resolves with the parent scene path if it exists, or null if it does not.
   */
  async function getParentScenePath(scene_id) {
    const reqData = {
      query: `{
          findScene(id: ${scene_id}){
            files {
              parent_folder {
                path
              }
            }
          }
        }`,
    };
    var result = await csLib.callGQL(reqData);
    const files = result.findScene.files;

    if (files && Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        if (file.parent_folder && file.parent_folder.path) {
          return file.parent_folder.path;
        }
      }
      return null;
    } else {
      return null;
    }
  }

  /**
   * The processImage function is called when the page loads.
   * It waits for the image container to load, then it gets the image path from local storage.
   * If there is an image path, it creates a button that links to its parent folder and adds it to the DOM.
   *
   *
   * @return The image path
   */
  function processImage() {
    let btnGrp = IMAGE_TARGET_SELECTOR;
    let wrapper = ".image-container";
    waitForElm(wrapper).then(async ($el) => {
      const [_, image_id] = getScenarioAndID();
      const imagePath = await getParentImagePath(image_id);
      if (imagePath) {
        waitForElm(btnGrp).then(async ($btnGrpEl) => {
          if (!document.querySelector("#parentFolder")) {
            const btn = document.createElement("button");
            const spn = document.createElement("span");
            btn.setAttribute("id", "parentFolder");
            btn.setAttribute("class", "minimal btn btn-secondary");
            btn.setAttribute("title", "View parent folder");
            const svg = `<svg fill="#FFFFFF" height="14" width="14" id="Layer_1" class="svg-inline--fa" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path class="cls-1" d="M12,10V7H8V5H9V2H6V5H7V7H3v3H2v3H5V10H4V8H7v2H6v3H9V10H8V8h3v2H10v3h3V10ZM7,4V3H8V4Z"/></svg>`;
            btn.innerHTML = svg;
            spn.appendChild(btn);
            $btnGrpEl.prepend(spn);
            btn.addEventListener("click", function () {
              const parentPath = rawurlencode(
                addTrailingSlash(imagePath.replace(/^file:\/\//i, "")),
              );
              window.location.href = `/images?c=("type":"path","value":"%5C"${parentPath}%5C"","modifier":"INCLUDES")&sortby=updated_at&sortdir=desc&perPage=250`;
              return;
            });
          }
        });
      } else {
        const btn = document.querySelector("#parentFolder");
        if (btn && btn.parentElement.tagName == "span") {
          btn.parentElement.remove();
        }
      }
    });
  }

  /**
   * The processScene function is called when the page loads.
   * It waits for the video player to load, then it gets the scene ID from the URL and uses that to get a path to a file on disk.
   * If there is no path, it removes any &quot;parent folder&quot; button that may have been added previously.
   * If there is a path, it adds an event listener so that clicking on this button will take you back up one level in your directory structure (to where this scene was found).
   *
   *
   * @return A promise
   */
  function processScene() {
    let btnGrp = SCENE_TARGET_SELECTOR;
    let wrapper = ".VideoPlayer .video-wrapper";
    waitForElm(wrapper).then(async ($el) => {
      const [_, scene_id] = getScenarioAndID();
      const scenePath = await getParentScenePath(scene_id);
      if (scenePath) {
        waitForElm(btnGrp).then(async ($btnGrpEl) => {
          if (!document.querySelector("#parentFolder")) {
            const btn = document.createElement("button");
            const spn = document.createElement("span");
            btn.setAttribute("id", "parentFolder");
            btn.setAttribute("class", "minimal btn btn-secondary");
            btn.setAttribute("title", "View parent folder");
            const svg = `<svg fill="#FFFFFF" height="14" width="14" id="Layer_1" class="svg-inline--fa" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path class="cls-1" d="M12,10V7H8V5H9V2H6V5H7V7H3v3H2v3H5V10H4V8H7v2H6v3H9V10H8V8h3v2H10v3h3V10ZM7,4V3H8V4Z"/></svg>`;
            btn.innerHTML = svg;
            spn.appendChild(btn);
            $btnGrpEl.prepend(spn);
            btn.addEventListener("click", function () {
              const parentPath = rawurlencode(
                addTrailingSlash(scenePath.replace(/^file:\/\//i, "")),
              );
              window.location.href = `/scenes?c=("type":"path","value":"%5C"${parentPath}%5C"","modifier":"INCLUDES")&sortby=updated_at&sortdir=desc&perPage=250`;
              return;
            });
          }
        });
      } else {
        const btn = document.querySelector("#parentFolder");
        if (btn && btn.parentElement.tagName == "span") {
          btn.parentElement.remove();
        }
      }
    });
  }

  csLib.PathElementListener("/images/", IMAGE_TARGET_SELECTOR, processImage);
  csLib.PathElementListener("/scenes/", SCENE_TARGET_SELECTOR, processScene);
})();
