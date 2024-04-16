---
toc: false
---

# IMDB Top 5000 Movies

```js
function Swatches(color, {
  columns = null,
  format,
  unknown: formatUnknown,
  swatchSize = 15,
  swatchWidth = swatchSize,
  swatchHeight = swatchSize,
  marginLeft = 0
} = {}) {
  const id = `-swatches-${Math.random().toString(16).slice(2)}`;
  const unknown = formatUnknown == null ? undefined : color.unknown();
  const unknowns = unknown == null || unknown === d3.scaleImplicit ? [] : [unknown];
  const domain = color.domain().concat(unknowns);
  if (format === undefined) format = x => x === unknown ? formatUnknown : x;

  function entity(character) {
    return `&#${character.charCodeAt(0).toString()};`;
  }

  if (columns !== null) return htl.html`<div style="display: flex; align-items: center; margin-left: ${+marginLeft}px; min-height: 33px; font: 10px sans-serif;">
  <style>

.${id}-item {
  break-inside: avoid;
  display: flex;
  align-items: center;
  padding-bottom: 1px;
}

.${id}-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - ${+swatchWidth}px - 0.5em);
}

.${id}-swatch {
  width: ${+swatchWidth}px;
  height: ${+swatchHeight}px;
  margin: 0 0.5em 0 0;
}

  </style>
  <div style=${{width: "100%", columns}}>${domain.map(value => {
    const label = `${format(value)}`;
    return htl.html`<div class=${id}-item>
      <div class=${id}-swatch style=${{background: color(value)}}></div>
      <div class=${id}-label title=${label}>${label}</div>
    </div>`;
  })}
  </div>
</div>`;

  return htl.html`<div style="display: flex; align-items: center; min-height: 33px; margin-left: ${+marginLeft}px; font: 10px sans-serif;">
  <style>

.${id} {
  display: inline-flex;
  align-items: center;
  margin-right: 1em;
}

.${id}::before {
  content: "";
  width: ${+swatchWidth}px;
  height: ${+swatchHeight}px;
  margin-right: 0.5em;
  background: var(--color);
  opacity: 0.6;
}

  </style>
  <div>${domain.map(value => htl.html`<span class="${id}" style="--color: ${color(value)}">${format(value)}</span>`)}</div>`;
}
```

```js
const movies = FileAttachment("movies.csv").csv({typed: true});
```

```js
let groupedData = d3.group(movies, d => d.main_genre, d => d.Director);
const color = d3.scaleOrdinal([...new Set(movies.map(d => d.main_genre))], d3.schemeSet3);
let totalGrossData = [];
groupedData.forEach((directors, mainGenre) => {
    directors.forEach((movies, director) => {
        let totalGross = parseFloat(d3.sum(movies, d => parseFloat(d.Total_Gross.match(/[0-9.]+/))).toFixed(2));
        if (director.startsWith('Directors:')) director = director.split('Directors:')[1];
        if (totalGross > 0) totalGrossData.push({ mainGenre, director, totalGross });
    });
});
const width = 900;
const height = 800;

let treemapLayout = d3.treemap()
    .tile(d3.treemapSquarify)
    .size([width, height])
    .padding(1)
    .round(true);

let groupedByGenre = d3.group(totalGrossData, d => d.mainGenre);
let top10PerGenre = new Map();
groupedByGenre.forEach((values, genre) => {
    let sortedValues = values.slice().sort((a, b) => b.totalGross - a.totalGross);
    top10PerGenre.set(genre, sortedValues.slice(0, 10));
});
let root = d3.hierarchy({children: Array.from(top10PerGenre, ([key, value]) => ({ mainGenre: key, children: value }))})
    .sum(d => d.totalGross)
    .sort((a, b) => b.value - a.value);

treemapLayout(root);

let counter = 0;
function generateUniqueId() {
    return `id_${counter++}`;
}

const treemap = d3.create("svg")
  .attr("viewBox", [0, 0, width, height])
  .attr("width", width)
  .attr("height", height)
  .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

const leaf = treemap.selectAll("g")
    .data(root.leaves())
    .join("g")
    .attr("transform", d => `translate(${d.x0},${d.y0})`);

const format = d3.format(",d");
  leaf.append("title")
      .text(d => `[${d.data.mainGenre}]\n${d.ancestors().reverse().map(d => d.data.director).join("")}\n$${format(d.value)}M`);

leaf.append("rect")
      .attr("id", d => (d.leafUid = generateUniqueId()))
      .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.mainGenre); })
      .attr("fill-opacity", 0.6)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0);

leaf.append("clipPath")
      .attr("id", d => (d.clipUid = generateUniqueId()))
    .append("use")
      .attr("xlink:href", d => d.leafUid.href);

const textLeaf = treemap.selectAll("g").filter(d => {
    return ((d.x1 - d.x0) > 50 && (d.y1 - d.y0) > 32);
});
textLeaf.append("text")
      .attr("clip-path", d => d.clipUid)
    .selectAll("tspan")
    .data(d => d.data.director.split(/(?=[A-Z][a-z])|\s+/g).concat(`$${format(d.value)}M`))
    .join("tspan")
      .attr("x", 3)
      .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
      .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
      .text(d => d);

const smallLeaf = treemap.selectAll("g").filter(d => {
    return ((d.x1 - d.x0) <= 50 || (d.y1 - d.y0) <= 32);
});
smallLeaf.append("text")
      .attr("clip-path", d => d.clipUid)
    .selectAll("tspan")
    .data(d => ['...'])
    .join("tspan")
      .attr("x", 3)
      .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
      .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
      .text(d => d);

Object.assign(treemap.node(), {scales: {color}});
let legend = Swatches(color)
```

<br>
<h2>Most successful directors per movie genre</h2>
<div>${legend}</div>
<div>${treemap}</div>
<br>

<h2>Average gross income per year and per genre</h2>
<select id="yearSelect"></select>
<div id="line-plot"></div>

```js
// Prepare data
let groupData = d3.group(movies, d => d.Year, d => d.main_genre)
let finishedFilter = []
groupData.forEach((values, year) => {
    let result = []
    values.forEach((values, genre) => {
        let total = 0
        let temp = 0.0
        values.forEach(d => {
            if (d.Total_Gross !== "Gross Unkown") {
                total += 1
                temp += parseFloat(d.Total_Gross.match(/[0-9.]+/))
            }
        })
        result.push({genre: genre, average_gross: temp != 0.0 ? (temp / total).toFixed(2) : 0.0})
    })
    finishedFilter.push({year: year, average_gross_genre: result})
})
let sorted = d3.sort(finishedFilter, d => -d.year).filter(d => d.average_gross_genre.filter(t => t.average_gross != 0).length != 0)

// Graph marges
const margin = {top: 20, right: 20, bottom: 50, left: 50};
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Genres list
const genres = ['Action', 'Biography', 'Animation', 'Adventure', 'Crime', 'Comedy', 'Drama', 'Mystery', 'Horror', 'Fantasy'].sort()

// Creat selection for year
const select = d3.select("#yearSelect");
select.selectAll("option")
    .data(sorted)
    .enter().append("option")
    .text(d => d.year);

// Create graph when selected
function updateChart(data) {
    const yearData = data.average_gross_genre

    // Add missing data for graph
    for (let temp of genres) {
        console.log(temp)
        if (yearData.filter(d => d.genre == temp).length == 0) {
            console.log(temp)
            yearData.push({genre: temp, average_gross: 0.0})
        }
    }

    // Remove already existing graph
    d3.select("#line-plot").selectAll("*").remove();

    // Add title text
    d3.select("#line-plot").append("h3")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("fill", "#F0F8FF")
        .text("Average gross income by Genre in the year " + data.year);

    // Create svg for creating graph
    const svg = d3.select("#line-plot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Create x scale
    const x = d3.scaleBand()
        .domain(genres)
        .range([0, width])
        .padding(0.1);

    // Create y scale
    let max = d3.max(yearData.map(d => parseInt(d.average_gross)))

    const y = d3.scaleLinear()
        .domain([0, max + 0.1 * max])
        .range([height, 0]);

    // Add bars
    svg.selectAll(".bar")
        .data(yearData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.genre))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d.average_gross))
        .attr("height", d => height - y(d.average_gross))
        .style("fill", "#69b3a2")

    // Add money on top of bar
    svg.selectAll(".income-text")
        .data(yearData)
        .enter().append("text")
        .attr("class", "income-text")
        .attr("x", d => x(d.genre) + x.bandwidth() / 2)
        .attr("y", d => y(d.average_gross) - 5) // Adjust position to be slightly above the bar
        .attr("text-anchor", "middle")
        .text(d => `${d.average_gross}$`)
        .style("font-size", "12px")
        .style("fill", "white");

    // Draw x axis
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Draw y axis
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));
}

// Default start value
updateChart(sorted[Object.keys(sorted)[0]]);

// Event listener for select box
select.on("change", function () {
    const selectedYear = this.value;
    updateChart(sorted.filter(d => d.year == selectedYear)[0]);
});
```