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
<h2>Average Movie score per Actor</h2>
<div id="my_dataviz" style="position: relative; display: flex; flex-direction: column">
<label for="artist">Search Artist:</label>
<input type="text" id="artist" style="border-radius: 10px; padding: 7px">
</div>

```js
import * as Plot from "npm:@observablehq/plot";
var actorScores = {};
var actorMoviesCount = {};
let groupData = d3.group(movies, d => d.Actors)
display(movies)

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

const data = [];
for (const actor in actorScores) {
    data.push({"actor": actor, "mean_score": d3.mean(actorScores[actor]), "movies_count": actorMoviesCount[actor]});
}
display(data)
```

```js
const width = 900;
const height = 800;
const staticColor = '#437c90';
const hoverColor = '#eec42d';
const padding = {top: 20, left: 30, right: 40, bottom: 20};

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

const graph = d3.select("#my_dataviz")
    .append("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; position: relative")
    
const search = d3.select("#artist")
    .on("input", function() {
        const value = this.value;
        console.log(value)
        let filteredData = data.filter(d => d.actor.toLowerCase().includes(value.toLowerCase()));
        if (value === "") {
            filteredData = data;
        }
        console.log(filteredData)
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
                    `<h1>${i.actor}</h1>
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
    });

const xScale = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.movies_count)])
                .range([padding.left, width - padding.right]);

const yScale = d3.scaleLinear()
                .domain([0, 10])
                .range([height - padding.bottom, padding.top]);

const xAxis = d3.axisBottom()
                .scale(xScale);

const yAxis = d3.axisLeft()
                .scale(yScale);

graph.selectAll("circle")
.data(data)
.enter()
.append("circle")
.attr("cx", d => xScale(d.movies_count))
.attr("cy", d => yScale(d.mean_score))
.attr("r", 4)
.attr("fill", staticColor)
.on('mouseover', function (d, i) {
          tooltip
            .html(
              `<h1>${i.actor}</h1>
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

function updateData() {
    data.push(...data.splice(0, 2));
    data.shift();
    
    xScale.domain([0, d3.max(data, d => d[0])]);
    yScale.domain([0, d3.max(data, d => d[1])]);
    
    let circles = graph.selectAll("circle").data(data);
    
    circles.enter()                      
      .append("circle")
      .attr("cx", d => xScale(0))     // position the new data points in the origin
      .attr("cy", d => yScale(0))
      .attr("r", 2)
    .merge(circles)                   // merge the existing circles with the new ones
      .transition()                   // and transition everything to their new position
      .on("start", function () {
        d3.select(this)
          .attr("fill", "hotpink")
          .attr("r", 5);
      })
      .attr("cx", d => xScale(d[0]))
      .attr("cy", d => yScale(d[1]))
      .on("end", function () {
        d3.select(this)
          .attr("fill", "black")
          .attr("r", 2);
      });
    
    graph.select(".x.axis")
      .transition()
      .call(xAxis);
    
    graph.select(".y.axis")
      .transition()
      .call(yAxis);
}

  
//display(graph.node())
```