---
toc: false
theme: default
---

# IMDB Top 5000 Movies

Every big movie studio wants to make a great movie that creates a lot of revenue, but where to start. There are a lot
of options to choose from. Which genre creates the most money. Which actor attracts people to the cinema.
DWe did a study on the dataset of IMDB's Top 5000 movies to create a clear conclusion. We hope this helps your studio
for making a good and profitable movie.


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

const displayingActor = true;
```

<br>
<h2>Most successful directors per movie genre</h2>
<div>${legend}</div>
<div>${treemap}</div>

<br>
<div style="position: relative; display: flex; flex-direction: row;">
    <h2>Average Movie score per</h2>
    <button id="actorButton" style="margin-left: 5px;
                   margin-right: 3px; 
                   font-size: larger; 
                   font-family: Volkhov;
                   border-radius: 7px;
                   background-color: #437c90">Actor</button>
    <button id="directorButton" style="margin-left: 5px;
                   margin-right: 3px; 
                   font-size: larger; 
                   font-family: Volkhov;
                   border-radius: 7px;
                   background-color: #437c90">Director</button>
</div>

<div id="my_dataviz" style="position: relative; display: flex; flex-direction: column">
    <label for="artist">Search Artist:</label>
    <input type="text" id="artist" style="border-radius: 10px; padding: 7px">
</div>

```js
import * as Plot from "npm:@observablehq/plot";

var actorScores = {};
var actorMoviesCount = {};
let groupData = d3.group(movies, d => d.Actors)

groupData.forEach((movies, actor) => {
    const actors = actor.split(',');
    for (let i = 0; i < actors.length; i++) {
        actors[i] = actors[i].trim();
        if (actorScores[actors[i]] === undefined) {
            actorScores[actors[i]] = [];
            actorMoviesCount[actors[i]] = 0;
        }
        for (let j = 0; j < movies.length; j++) {
            actorScores[actors[i]].push(parseFloat(movies[j].Rating));
            actorMoviesCount[actors[i]]++;
        }
    }
});

const actordata = [];
for (const actor in actorScores) {
    actordata.push({
        "artist": actor,
        "mean_score": d3.mean(actorScores[actor]),
        "movies_count": actorMoviesCount[actor]
    });
}
```

```js
var directorScores = {};
var directorMoviesCount = {};
let groupData = d3.group(movies, d => d.Director)

groupData.forEach((movies, director) => {
    if (director.startsWith('Directors:')) director = director.split('Directors:')[1];
    const directors = director.split(',');
    for (let i = 0; i < directors.length; i++) {
        directors[i] = directors[i].trim();
        if (directorScores[directors[i]] === undefined) {
            directorScores[directors[i]] = [];
            directorMoviesCount[directors[i]] = 0;
        }
        for (let j = 0; j < movies.length; j++) {
            directorScores[directors[i]].push(parseFloat(movies[j].Rating));
            directorMoviesCount[directors[i]]++;
        }
    }
});

const directordata = [];
for (const director in directorScores) {
    directordata.push({
        "artist": director,
        "mean_score": d3.mean(directorScores[director]),
        "movies_count": directorMoviesCount[director]
    });
}

```

```js
let actorSelected = true;
const width = 900;
const height = 800;
const staticColor = '#437c90';
const hoverColor = '#eec42d';
const padding = {top: 20, left: 30, right: 40, bottom: 30};

// Add the tooltip
const tooltip = d3.select("#my_dataviz")
    .append('div')
    .attr('class', 'd3-tooltip')
    .style('position', 'absolute')
    .style('z-index', '10')
    .style('visibility', 'hidden')
    .style('padding', '10px')
    .style('background', 'rgba(0,0,0,0.6)')
    .style('border-radius', '4px')
    .style('color', '#fff')
    .style('left', "0px")
    .style('top', "0px")
    .text('a simple tooltip');

// Create the SVG for scatter plot
const graph = d3.select("#my_dataviz")
    .append("svg")
      .attr("viewBox", [0, 0, width, height + padding.bottom])
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; position: relative")
 
// Add the search bar to filter the data
const search = d3.select("#artist")
    .on("input", function() {
        const value = this.value;
        let data = actordata
        if (!actorSelected) {
            data = directordata;
        }
        let filteredData = data.filter(d => d.artist.toLowerCase().includes(value.toLowerCase()));
        if (value === "") {
            filteredData = data;
        }
        transissionToOtherData(filteredData);
    });

// Add the buttons to switch between actor and director
d3.select("#actorButton")
    .on("click", function() {
        actorSelected = true;
        transissionToOtherData(actordata);
    });

d3.select("#directorButton")
    .on("click", function() {
        actorSelected = false;
        transissionToOtherData(directordata);
    });

const xScale = d3.scaleLinear()
                .domain([0, d3.max(actordata, d => d.movies_count)])
                .range([padding.left, width - padding.right]);

const yScale = d3.scaleLinear()
                .domain([0, 10])
                .range([height - padding.bottom, padding.top]);

const xAxis = d3.axisBottom()
                .scale(xScale);

const yAxis = d3.axisLeft()
                .scale(yScale);

graph.selectAll("circle")
.data(actordata)
.enter()
.append("circle")
.attr("cx", d => xScale(d.movies_count))
.attr("cy", d => yScale(d.mean_score))
.attr("r", 4)
.attr("fill", staticColor)
.on('mouseover', function (d, i) {
          tooltip
            .html(
              `<h1>${i.artist}</h1>
              <div>Amount of movies: ${i.movies_count}</div>
              <div>Average movie score: ${i.mean_score.toFixed(2)}</div>`
            )
            .style('visibility', 'visible');
          d3.select(this).transition().attr('fill', hoverColor).attr("r", 6);
      })
.on('mousemove', function (evt, d) {
  const [mx, my] = d3.pointer(evt);
  tooltip
    .style("left", (mx + 10) + "px") 
    .style("top", (my + 10) + "px")
})
.on('mouseout', function () {
  tooltip.html(``).style('visibility', 'hidden');
  d3.select(this).transition().attr('fill', staticColor).attr("r", 4);
});

graph.append("g") 
.attr("class", "x axis")
.attr("transform", `translate(0, ${height - padding.bottom})`)
.call(xAxis);

graph.append("g") 
.attr("class", "y axis")
.attr("transform", `translate(${padding.left}, 0)`)
.call(yAxis);

graph.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 20)
    .style("font-size", "20px")
    .style("fill", "white")
    .text("Number of Movies");

graph.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("x", -height / 2)
    .attr("y", -15)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .style("font-size", "20px")
    .style("fill", "white")
    .text("Average Movie Score");


function transissionToOtherData(filteredData) {
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.movies_count)])
        .range([padding.left, width - padding.right]);
    const yScale = d3.scaleLinear()
        .domain([0, 10])
        .range([height - padding.bottom, padding.top]);
    const xAxis = d3.axisBottom()
        .scale(xScale);
    const yAxis = d3.axisLeft()
        .scale(yScale);
    
    let circles = graph.selectAll("circle").data(filteredData);
    // Update existing circles
    circles
        .transition()
        .attr("cx", d => xScale(d.movies_count))
        .attr("cy", d => yScale(d.mean_score));
    
    // Handle enter selection
    circles.enter()
        .append("circle")
        .attr("cx", d => xScale(d.movies_count))
        .attr("cy", d => yScale(d.mean_score))
        .attr("r", 2)
        .attr("fill", "hotpink") // Set initial fill for newly appended circles
        .transition()
        .attr("r", 5)
        .attr("fill", staticColor)
    
    circles.exit()
        .transition()
        .attr("r", 0)
        .remove();
    
    graph.select(".x.axis")
        .transition()
        .call(xAxis);
    graph.select(".y.axis")
        .transition()
        .call(yAxis);
    
    circles = graph.selectAll("circle"); // Re-select all circles after updating
    circles.on('mouseover', function (d, i) {
        tooltip
            .html(
                `<h1>${i.artist}</h1>
                <div>Amount of movies: ${i.movies_count}</div>
                <div>Average movie score: ${i.mean_score.toFixed(2)}</div>`
            )
            .style('visibility', 'visible');
        d3.select(this).transition().attr('fill', hoverColor).attr("r", 6);
    })
    .on('mousemove', function (evt, d) {
        const [mx, my] = d3.pointer(evt);
        tooltip
            .style("left", (mx + 10) + "px")
            .style("top", (my + 10) + "px")
    })
    .on('mouseout', function () {
        tooltip.html(``).style('visibility', 'hidden');
        d3.select(this).transition().attr('fill', staticColor).attr("r", 4);
    });
}
```
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
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Genres list
const genres = ['Action', 'Biography', 'Film-Noir', 'Western', 'Musical', 'Animation', 'Adventure', 'Crime', 'Comedy', 'Drama', 'Mystery', 'Horror', 'Fantasy'].sort()

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
        if (yearData.filter(d => d.genre == temp).length == 0) {
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
        .domain([0, max + 10])
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
        .text(d => `$${d.average_gross}M`)
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
<br>
<h2>Average box-office per rating</h2>
For censor ratings "12" and "18+" the box-office is unknown. The box-office is in million dollars.
<div id="averageBoxOffice"></div>

```js
var censorBoxOffice = {};
let groupedDataByCensor = d3.group(movies, d => d.Censor);

groupedDataByCensor.forEach((movies, censor) => {
    censorBoxOffice[censor] = [];
    for (let j = 0; j < movies.length; j++) {
        if (movies[j].Total_Gross !== 'Gross Unkown') {
            censorBoxOffice[censor].push(parseFloat(movies[j].Total_Gross.match(/[0-9.]+/)));
        }
    }
});

const combinedArray = censorBoxOffice['Not Rated'].concat(censorBoxOffice['Unrated']);
const average = d3.mean(combinedArray);
censorBoxOffice['Not Rated'] = [];
censorBoxOffice['Not Rated'].push(average);

const order = ['Not Rated', '(Banned)', 'All', 'U', 'G', 'U/A', 'PG', 'PG-13', '7', 'UA 7+', 'UA', '12+', '13', 'UA 13+', '15+', '16', 'UA 16+', 'R', 'NC-17', '18', 'M/PG', 'A']
const boxOfficeData = [];
for (const censor of order) {
    console.log(censor)
    if (censor !== 'Unrated' && censor !== '12' && censor !== '18+') {
        boxOfficeData.push({
            "Censor": censor,
            "Value": d3.mean(censorBoxOffice[censor])
        });
    }
}

```

```js
// set the dimensions and margins of the graph
var margin = {top: 30, right: 30, bottom: 70, left: 60};
const width = 900;
const height = 800;

// append the svg object to the body of the page
var svg = d3.select("#averageBoxOffice")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");


// X axis
var x = d3.scaleLinear()
    .domain([0, 250])
    .range([ 0, width ]);
    
svg.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x))
  .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", 600)
    .attr("y", height + 55)
    .text("Average box-office (in million dollars)")
    .style("font-size", "20px")
    .style("fill", "white");

// Add Y axis
var y = d3.scaleBand()
    .domain(boxOfficeData.map(function(d) { return d.Censor; }))
    .range([ height, 0])
    .padding(0.2);
svg.append("g")
  .call(d3.axisLeft(y));

// Bars
let bars = svg.selectAll("mybar")
    .data(boxOfficeData)
    .enter()
    .append("g")
    
bars.append("rect")
    .attr("class", "bar")
    .attr("x", x(0))
    .attr("y", function(d) { return y(d.Censor); } )
    .attr("width", function(d) { return x(d.Value); })
    .attr("height",function(d) { return y.bandwidth(); } )
    .attr("fill", "#F5C518");

bars.append("text")
    .attr("class", "label")
    .attr("x", function(d) { return x(d.Value) + 35; })
    .attr("y", function(d) { return y(d.Censor) + y.bandwidth() * (0.5 + 0.1); }) // Adjust position to be slightly above the bar
    .attr("text-anchor", "middle")
    .text(function(d) { return `$${d.Value.toFixed(2)}M`; })
    .style("font-size", "12px")
    .style("fill", "white")
    .style("font-weight", "bold");
```