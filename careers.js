
    const CAREERS_EMAIL = "careers@al-khwarizmi.co";
    const jobsList = document.getElementById("jobsList");
    const profile = document.getElementById("positionProfile");
    const profileTitle = document.getElementById("profileTitle");
    const profileDepartment = document.getElementById("profileDepartment");
    const profileBody = document.getElementById("profileBody");
    let positions = Array.isArray(window.ALKHWARIZMI_OPEN_POSITIONS)
      ? window.ALKHWARIZMI_OPEN_POSITIONS
      : [];
    let activePositionIndex = null;

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function renderList(items) {
      return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    }

    function renderPartnerLogo(position, className = "job-partner-logo") {
      if (!position.partnerLogo) return "";

      const alt = position.partnerLogoAlt || "Partner logo";

      return `
        <div class="${escapeHtml(className)}" aria-label="${escapeHtml(alt)}">
          <img src="${escapeHtml(position.partnerLogo)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" />
        </div>
      `;
    }

    function renderApplicationInstructions(position) {
      const instructions = position.applicationInstructions || [];
      if (!instructions.length) return "";

      return `
        <div class="job-detail job-detail-full">
          <h4>How to Apply</h4>
          <ul>${renderList(instructions)}</ul>
        </div>
      `;
    }

    function slugify(value) {
      return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    function getPositionSlug(position) {
      return slugify(position.slug || position.title || "open-position");
    }

    function getPositionSlugs(position) {
      const slugs = [getPositionSlug(position)];

      if (Array.isArray(position.legacySlugs)) {
        position.legacySlugs.forEach((slug) => {
          const normalized = slugify(slug);

          if (normalized && !slugs.includes(normalized)) {
            slugs.push(normalized);
          }
        });
      }

      return slugs;
    }

    function getPositionUrl(position) {
      const url = new URL(window.location.href);
      url.search = "";
      url.hash = `position-${getPositionSlug(position)}`;
      return url.href;
    }

    function getApplyEmail(position) {
      return String(position.applyTo || CAREERS_EMAIL).replace(/[^a-zA-Z0-9@._+-]/g, "") || CAREERS_EMAIL;
    }

    function getApplyHref(position) {
      if(position.applicationUrl && /^https:\/\/crm\.al-khwarizmi\.co\/careers\/apply\/[a-z0-9-]+$/.test(position.applicationUrl)) return position.applicationUrl;
      const subject = encodeURIComponent(position.applySubject || `Career Application - ${position.title}`);
      return `mailto:${getApplyEmail(position)}?subject=${subject}`;
    }

    async function copyText(value) {
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(value);
          return true;
        } catch (error) {
          // Continue to the fallback below when clipboard permission is blocked.
        }
      }

      const textArea = document.createElement("textarea");
      textArea.value = value;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      const copied = document.execCommand("copy");
      textArea.remove();
      return copied;
    }

    async function copyPositionLink(index, statusElement) {
      const position = positions[index];
      if (!position) return;

      try {
        const copied = await copyText(getPositionUrl(position));
        if (statusElement) {
          statusElement.textContent = copied ? "Post link copied" : "Post link is shown above";
        }
      } catch (error) {
        if (statusElement) {
          statusElement.textContent = "Post link is shown above";
        }
      }
    }

    function renderPosition(position, index) {
      const slug = getPositionSlug(position);
      const postUrl = getPositionUrl(position);

      return `
        <article class="job-card" id="position-${escapeHtml(slug)}">
          <button class="job-main" type="button" data-open-position="${index}" aria-describedby="summary-${escapeHtml(slug)}">
            <div class="job-kicker">${escapeHtml(position.department || "Open Position")}</div>
            <h3>${escapeHtml(position.title)}</h3>
            <p class="job-summary" id="summary-${escapeHtml(slug)}">${escapeHtml(position.summary || "")}</p>
            <div class="job-meta" aria-label="Position details">
              <span class="job-pill">${escapeHtml(position.location || "Iraqi Kurdistan")}</span>
              <span class="job-pill">${escapeHtml(position.type || "Full-time")}</span>
              <span class="job-pill">${escapeHtml(position.status || "Open")}</span>
            </div>
            <span class="open-profile-text">Open position profile</span>
          </button>
          <aside class="job-side" aria-label="Apply details">
            ${renderPartnerLogo(position)}
            <div>
              <div class="side-label">Posted</div>
              <div class="side-value">${escapeHtml(position.posted || "Open")}</div>
            </div>
            <div>
              <div class="side-label">Department</div>
              <div class="side-value">${escapeHtml(position.department || "General")}</div>
            </div>
            <button class="copy-link-button" type="button" data-copy-position="${index}">Copy post link</button>
            <div class="share-status" id="share-status-${index}" aria-live="polite"></div>
            <a class="apply-button" href="${escapeHtml(getApplyHref(position))}">${position.applicationUrl ? 'Apply now' : 'Apply by email'}</a>
            <div class="profile-link">${escapeHtml(postUrl)}</div>
          </aside>
        </article>
      `;
    }

    function openPosition(index, updateHash = true) {
      const position = positions[index];
      if (!position) return;

      activePositionIndex = index;
      profileTitle.textContent = position.title || "Position profile";
      profileDepartment.textContent = position.department || "Open Position";

      const postUrl = getPositionUrl(position);
      profileBody.innerHTML = `
        <div>
          <p class="profile-summary">${escapeHtml(position.summary || "")}</p>
          <div class="job-meta" aria-label="Position details">
            <span class="job-pill">${escapeHtml(position.location || "Iraqi Kurdistan")}</span>
            <span class="job-pill">${escapeHtml(position.type || "Full-time")}</span>
            <span class="job-pill">${escapeHtml(position.status || "Open")}</span>
          </div>
          <div class="job-detail-grid">
            <div class="job-detail">
              <h4>Responsibilities</h4>
              <ul>${renderList(position.responsibilities || [])}</ul>
            </div>
            <div class="job-detail">
              <h4>Requirements</h4>
              <ul>${renderList(position.requirements || [])}</ul>
            </div>
            ${renderApplicationInstructions(position)}
          </div>
        </div>
        <aside class="profile-side" aria-label="Position profile actions">
          ${renderPartnerLogo(position, "profile-partner-logo")}
          <div>
            <div class="side-label">Posted</div>
            <div class="side-value">${escapeHtml(position.posted || "Open")}</div>
          </div>
          <div>
            <div class="side-label">Application email</div>
            <div class="side-value">${escapeHtml(getApplyEmail(position))}</div>
          </div>
          <div>
            <div class="side-label">Shareable post link</div>
            <div class="profile-link">${escapeHtml(postUrl)}</div>
          </div>
          <button class="copy-link-button" type="button" data-copy-position="${index}">Copy post link</button>
          <div class="share-status" id="profile-share-status" aria-live="polite"></div>
          <a class="apply-button" href="${escapeHtml(getApplyHref(position))}">${position.applicationUrl ? 'Apply now' : 'Apply by email'}</a>
        </aside>
      `;

      profile.hidden = false;
      document.body.classList.add("profile-open");

      if (updateHash) {
        history.pushState(null, "", `#position-${getPositionSlug(position)}`);
      }

      profile.querySelector(".profile-close").focus();
    }

    function closePosition(clearHash = true) {
      profile.hidden = true;
      document.body.classList.remove("profile-open");
      activePositionIndex = null;

      if (clearHash && window.location.hash.startsWith("#position-")) {
        history.pushState(null, "", window.location.pathname + window.location.search);
      }
    }

    function openPositionFromHash() {
      if (!window.location.hash.startsWith("#position-")) return;

      const slug = window.location.hash.replace("#position-", "");
      const index = positions.findIndex((position) => getPositionSlugs(position).includes(slug));
      if (index >= 0) {
        const canonicalSlug = getPositionSlug(positions[index]);

        if (slug !== canonicalSlug) {
          history.replaceState(null, "", `#position-${canonicalSlug}`);
        }

        openPosition(index, false);
      }
    }

    const legacyPositions = positions.slice();
    async function loadPositions() {
      try {
        const response = await fetch('https://crm.al-khwarizmi.co/api/public/recruitment/jobs', {credentials:'omit',cache:'no-store'});
        if (!response.ok) throw new Error('Careers unavailable');
        const data = await response.json();
        if (!Array.isArray(data.positions)) throw new Error('Invalid response');
        const existing = new Set(data.positions.map(position=>position.slug));
        positions = [...data.positions,...legacyPositions.filter(position=>!existing.has(position.slug))];
        jobsList.innerHTML = positions.length ? positions.map(renderPosition).join('') : '<div class="empty-state"><h3>No open positions currently.</h3><p>Please check again for new opportunities, or email a general CV to careers@al-khwarizmi.co.</p></div>';
        if (!profile.hidden) {
          const slug = window.location.hash.replace('#position-', '');
          if (!positions.some(position=>getPositionSlug(position)===slug)) closePosition(false);
        }
        openPositionFromHash();
      } catch (error) {
        jobsList.innerHTML = '<div class="empty-state"><h3>Positions could not be loaded.</h3><p>Please reload this page or contact careers@al-khwarizmi.co.</p></div>';
      }
    }
    jobsList.textContent = 'Loading open positions…';
    loadPositions();
    setInterval(()=>{if(!document.hidden)loadPositions();},60000);

    jobsList.addEventListener("click", (event) => {
      const openButton = event.target.closest("[data-open-position]");
      const copyButton = event.target.closest("[data-copy-position]");

      if (openButton) {
        openPosition(Number(openButton.dataset.openPosition));
      }

      if (copyButton) {
        const index = Number(copyButton.dataset.copyPosition);
        const statusElement = document.getElementById(`share-status-${index}`);
        copyPositionLink(index, statusElement);
      }
    });

    profile.addEventListener("click", (event) => {
      const closeButton = event.target.closest("[data-close-profile]");
      const copyButton = event.target.closest("[data-copy-position]");

      if (closeButton) {
        closePosition();
      }

      if (copyButton) {
        const index = Number(copyButton.dataset.copyPosition);
        const statusElement = document.getElementById("profile-share-status");
        copyPositionLink(index, statusElement);
      }
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !profile.hidden) {
        closePosition();
      }
    });

    window.addEventListener("hashchange", openPositionFromHash);
    openPositionFromHash();
