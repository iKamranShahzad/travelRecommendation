document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const resetBtn = document.getElementById("resetBtn");
  const resultsContainer = document.getElementById("results");

  let travelData = null;

  const timeZones = {
    Australia: "Australia/Sydney",
    "Sydney, Australia": "Australia/Sydney",
    "melbourne.jfif": "Australia/Melbourne",
    Japan: "Asia/Tokyo",
    "Tokyo, Japan": "Asia/Tokyo",
    "Kyoto, Japan": "Asia/Tokyo",
    Brazil: "America/Sao_Paulo",
    "Rio de Janeiro, Brazil": "America/Sao_Paulo",
    "São Paulo, Brazil": "America/Sao_Paulo",
    "Angkor Wat, Cambodia": "Asia/Phnom_Penh",
    "Taj Mahal, India": "Asia/Kolkata",
    "Bora Bora, French Polynesia": "Pacific/Tahiti",
    "Copacabana Beach, Brazil": "America/Sao_Paulo",
  };

  function getLocalDateTime(timeZone) {
    try {
      const options = {
        timeZone: timeZone,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      };
      return new Date().toLocaleString("en-US", options);
    } catch (error) {
      console.error(`Error getting time for ${timeZone}:`, error);
      return "Time information unavailable";
    }
  }

  fetch("travel_recommendation_api.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Travel data loaded successfully:", data);
      travelData = data;
    })
    .catch((error) => {
      console.error("Error fetching travel data:", error);
      resultsContainer.innerHTML = `<p class="error">Failed to load travel recommendations. Please try again later.</p>`;
    });

  searchBtn.addEventListener("click", performSearch);
  resetBtn.addEventListener("click", resetSearch);
  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch();
    }
  });

  function matchesKeyword(text, keyword) {
    if (!text || !keyword) return false;

    text = text.toLowerCase();
    keyword = keyword.toLowerCase();

    if (text.includes(keyword)) return true;

    const variations = {
      beach: ["beaches", "shore", "coast", "seaside"],
      beaches: ["beach", "shore", "coast", "seaside"],
      temple: ["temples", "shrine", "sanctuary"],
      temples: ["temple", "shrine", "sanctuary"],
      city: ["cities", "town", "metropolis", "urban"],
      cities: ["city", "town", "metropolis", "urban"],
      australia: ["australian", "sydney", "melbourne"],
      japan: ["japanese", "tokyo", "kyoto"],
      brazil: ["brazilian", "rio", "sao paulo", "copacabana"],
    };

    if (variations[keyword]) {
      for (const variation of variations[keyword]) {
        if (text.includes(variation)) return true;
      }
    }

    if (keyword.endsWith("s") && text.includes(keyword.slice(0, -1)))
      return true;
    if (keyword.endsWith("es") && text.includes(keyword.slice(0, -2)))
      return true;

    return false;
  }

  function performSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    if (!searchTerm) {
      resultsContainer.innerHTML = "<p>Please enter a search term.</p>";
      return;
    }

    if (!travelData) {
      resultsContainer.innerHTML =
        "<p>Travel data is still loading. Please try again in a moment.</p>";
      return;
    }

    resultsContainer.innerHTML = "";

    let resultsFound = false;
    let resultsHTML = '<div class="search-results">';

    if (travelData.countries) {
      const countryResults = searchCountries(searchTerm, travelData.countries);
      if (countryResults) {
        resultsHTML += countryResults;
        resultsFound = true;
      }
    }

    if (travelData.temples) {
      const templeResults = searchDestinations(
        searchTerm,
        travelData.temples,
        "Temples"
      );
      if (templeResults) {
        resultsHTML += templeResults;
        resultsFound = true;
      }
    }

    if (travelData.beaches) {
      const beachResults = searchDestinations(
        searchTerm,
        travelData.beaches,
        "Beaches"
      );
      if (beachResults) {
        resultsHTML += beachResults;
        resultsFound = true;
      }
    }

    resultsHTML += "</div>";

    if (resultsFound) {
      resultsContainer.innerHTML = resultsHTML;
    } else {
      resultsContainer.innerHTML = `<p>No results found for "${searchTerm}". Try another search term.</p>`;
    }
  }

  function searchCountries(searchTerm, countries) {
    let html = "";
    let foundResults = false;

    countries.forEach((country) => {
      const countryMatch = matchesKeyword(country.name, searchTerm);
      let citiesHTML = "";
      let citiesFound = false;

      const countryTimeZone = timeZones[country.name];
      const countryTime = countryTimeZone
        ? getLocalDateTime(countryTimeZone)
        : null;

      if (country.cities) {
        country.cities.forEach((city) => {
          if (
            matchesKeyword(city.name, searchTerm) ||
            matchesKeyword(city.description, searchTerm) ||
            countryMatch
          ) {
            const cityTimeZone = timeZones[city.name] || countryTimeZone;
            const localTime = cityTimeZone
              ? getLocalDateTime(cityTimeZone)
              : null;

            citiesHTML += `
                  <div class="destination-card">
                    <img src="${city.imageUrl}" alt="${
              city.name
            }" onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
                    <div class="destination-info">
                      <h3>${city.name}</h3>
                      <p>${city.description}</p>
                      ${
                        localTime
                          ? `<p class="local-time"><i class="far fa-clock"></i> Local time: ${localTime}</p>`
                          : ""
                      }
                    </div>
                  </div>
                `;
            citiesFound = true;
          }
        });
      }

      if (countryMatch || citiesFound) {
        html += `<div class="category">
                      <h2>${country.name}${
          countryTime
            ? ` <span class="country-time">Current time: ${countryTime}</span>`
            : ""
        }</h2>
                      <div class="destinations-grid">${citiesHTML}</div>
                    </div>`;
        foundResults = true;
      }
    });

    return foundResults ? html : null;
  }

  function searchDestinations(searchTerm, destinations, categoryName) {
    let html = "";
    let foundResults = false;

    html += `<div class="category"><h2>${categoryName}</h2><div class="destinations-grid">`;

    destinations.forEach((destination) => {
      if (
        matchesKeyword(destination.name, searchTerm) ||
        matchesKeyword(destination.description, searchTerm) ||
        matchesKeyword(categoryName, searchTerm)
      ) {
        const destinationTimeZone = timeZones[destination.name];
        const localTime = destinationTimeZone
          ? getLocalDateTime(destinationTimeZone)
          : null;

        html += `
              <div class="destination-card">
                <img src="${destination.imageUrl}" alt="${
          destination.name
        }" onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
                <div class="destination-info">
                  <h3>${destination.name}</h3>
                  <p>${destination.description}</p>
                  ${
                    localTime
                      ? `<p class="local-time"><i class="far fa-clock"></i> Local time: ${localTime}</p>`
                      : ""
                  }
                </div>
              </div>
            `;
        foundResults = true;
      }
    });

    html += "</div></div>";
    return foundResults ? html : null;
  }

  function resetSearch() {
    searchInput.value = "";
    resultsContainer.innerHTML = "";
  }

  const style = document.createElement("style");
  style.textContent = `
        .search-results {
          margin-top: 2rem;
        }
        .category {
          margin-bottom: 3rem;
        }
        .category h2 {
          color: #333;
          border-bottom: 2px solid #f8c300;
          padding-bottom: 0.5rem;
          margin-bottom: 1.5rem;
        }
        .country-time {
          font-size: 0.9rem;
          font-weight: normal;
          color: #666;
          margin-left: 1rem;
        }
        .destinations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }
        .destination-card {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .destination-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
        }
        .destination-card img {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }
        .destination-info {
          padding: 1.5rem;
        }
        .destination-info h3 {
          margin-top: 0;
          margin-bottom: 0.75rem;
          color: #222;
        }
        .destination-info p {
          margin: 0;
          color: #666;
          line-height: 1.5;
        }
        .local-time {
          margin-top: 1rem !important;
          color: #555;
          font-size: 0.9rem;
          border-top: 1px solid #eee;
          padding-top: 0.75rem;
        }
        .local-time i {
          margin-right: 0.5rem;
          color: #f8c300;
        }
        .error {
          color: #e74c3c;
          padding: 1rem;
          background-color: #fdf1f0;
          border-radius: 4px;
        }
      `;
  document.head.appendChild(style);
});
