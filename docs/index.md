---
toc: false
theme: default
---
<div style="display: flex; 
            flex-direction: row; 
            padding: 10px;
            justify-content: center;
            text-align: center;
            align-items: center; height: 5%;">
<img src="IMDB_Logo_2016.svg.png" width="100px" style="padding-right: 10px">
<h1> Top 5000 Movies</h1>
</div>

<div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 95%; width: 100%">

<i style="font-size: 20px; width: 1000px">
Every big movie studio wants to make a great movie that creates a lot of revenue, but where to start. There are a lot
of options to choose from. Which genre creates the most money. Which actor attracts people to the cinema.
We did a study on the dataset of IMDB's Top 5000 movies to create a clear conclusion. We hope this helps your studio
for making a good and profitable movie.
</i>



```js
const movies = FileAttachment("movies.csv").csv({typed: true});
```

<br>
<div style="position: relative; display: flex; flex-direction: row;">
    <h2>Gross income vs score in:</h2>
<select id="GrossGenreSelect" style="margin-left: 10px;
                    margin-right: 3px; 
                    padding-left: 15px;
                    padding-right: 15px;
                    font-size: 25px; 
                    font-family: Volkhov;
                    border-style: none;
                    border-radius: 20px;
                    "></select>
</div>
<div id="incomescore" style="position: relative; display: flex; flex-direction: column">
    <label for="name">Search Movie:</label>
    <input type="text" id="name" style="border-radius: 10px; padding: 7px">
    <div style="display: flex; flex-direction: row; margin-top: 10px;">
        <label style="margin-right: 10px" for="myRange">Range of release year:</label>
        <input type="range" id="GrossRange" min="0" max="10" step="0.1" value="0" style="width: 500px">
        <label id="rangeGross"></label>
    </div>
</div>



```js
import * as Plot from "npm:@observablehq/plot";

var movieScores = {};
var movieIncome = {};
var movieYear = {};
var movieGenre = {};
var GrossGenres = new Set();
movies.forEach(movie => {
    let movieName = movie.Movie_Title;
    let gross = movie.Total_Gross.trim();
    if (gross !== "Gross Unkown") {
        movieIncome[movieName] = parseFloat(gross.substring(1, gross.length - 1));
        let score = movie.Rating;   
        movieScores[movieName] = parseFloat(score);
        movieYear[movieName] = parseInt(movie.Year);
        movieGenre[movieName] = []
        movieGenre[movieName].push(movie.main_genre);
        for(let side of movie.side_genre.split(',')){
            side = side.trim();
            movieGenre[movieName].push(side);
            GrossGenres.add(side);
        }
        GrossGenres.add(movie.main_genre);
    }
    
    
});
GrossGenres = Array.from(GrossGenres);
GrossGenres.sort();
GrossGenres.unshift("All Movies");
const moviedata = [];
for (const movie in movieScores) {

    moviedata.push({
        "movie": movie,
        "score": movieScores[movie],
        "income": movieIncome[movie],
        "Year": movieYear[movie],
        "genres": movieGenre[movie]
    });
}
```


```js
const [GrossEarliestYear, GrossLatestYear] = d3.extent(movies, d => d.Year);
var GrosscurrentYear = GrossEarliestYear;
var GrosscurrentSearch = "";
var GrosscurrentGenre = "All Movies";

const width = 900;
const height = 800;
const staticColor = '#437c90';
const hoverColor = '#eec42d';
const padding = {top: 20, left: 30, right: 40, bottom: 30};
let prevXScale = [d3.scaleLinear()
        .domain([0, d3.max(moviedata, d => d.income)])
        .range([padding.left, width - padding.right])];

const select = d3.select("#GrossGenreSelect");

select.selectAll("option")
    .data(GrossGenres)
    .enter().append("option")
    .text(d => d);

// Add the tooltip
const tooltip = d3.select("#incomescore")
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
const graph = d3.select("#incomescore")
    .append("svg")
      .attr("viewBox", [0, 0, width, height + padding.bottom])
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; position: relative")

function GrossFilter() {
    let filteredData = moviedata.filter(d=>d.Year >= GrosscurrentYear);
    if(GrosscurrentGenre != "All Movies"){
        filteredData = filteredData.filter(d=>d.genres.includes(GrosscurrentGenre));
    }
    let searchData = filteredData.filter(d => d.movie.toLowerCase().includes(GrosscurrentSearch.toLowerCase()));
    if (GrosscurrentSearch === "") {
        searchData = filteredData;
    }
    transissionToSelectMovies(searchData);
}

select.on("change", function () {
    GrosscurrentGenre = this.value;
    GrossFilter();
});

const search = d3.select("#name")
    .on("input", function() {
        GrosscurrentSearch = this.value;
        GrossFilter();
    });


const YearText = d3.select("#rangeGross")
    .text(`${GrosscurrentYear}-${GrossLatestYear}`);

const Yearslider = d3.select("#GrossRange")
    .attr("min", EarliestYear)
    .attr("max", LatestYear)
    .attr("value", EarliestYear)
    .attr("step", 1)
    .on("input", function () {
        GrosscurrentYear = this.value;
        GrossFilter();
        YearText.text(`${GrosscurrentYear}-${LatestYear}`);
    });
const xScale = d3.scaleLinear()
                .domain([0, d3.max(moviedata, d => d.income)])
                .range([padding.left, width - padding.right]);

const yScale = d3.scaleLinear()
                .domain([0, 10])
                .range([height - padding.bottom, padding.top]);

const xAxis = d3.axisBottom()
                .scale(xScale);

const yAxis = d3.axisLeft()
                .scale(yScale);


function createStarPath(x, y, starScale) {
    // Define the coordinates of the star based on the scale factor
    const scale = starScale * 10; // Base size of the star (adjust as needed)
    const halfScale = scale / 2;
    
    // Calculate the coordinates of the star points
    const starPath = `
        M${x},${y - scale-scale}
        L${x + halfScale},${y + halfScale-scale}
        L${x + scale * 1.5},${y + scale * 0.7-scale}
        L${x + scale * 0.7},${y + scale * 1.5-scale}
        L${x + scale},${y + scale * 2.5-scale}
        L${x},${y + scale * 2-scale}
        L${x - scale},${y + scale * 2.5-scale}
        L${x - scale * 0.7},${y + scale * 1.5-scale}
        L${x - scale * 1.5},${y + scale * 0.7-scale}
        L${x - halfScale},${y + halfScale-scale}
        Z`;

    return starPath;
}
graph.selectAll("path")
.data(moviedata)
.enter()
.append("path")
.attr("d", d => createStarPath(xScale(d.income), yScale(d.score), 0.5))
.attr("fill", hoverColor)
.on('mouseover', function (d, i) {
          tooltip
            .html(
              `<h1>${i.movie}</h1>
              <div>Score of movie: ${i.score}</div>
              <div>Income of movie: ${"$" + i.income + "M"}</div>`
            )
            .style('visibility', 'visible');
          d3.select(this).transition().attr('fill', staticColor)
              .attr("d", d => createStarPath(xScale(d.income), yScale(d.score),0.6))
;
      })
    .on('mousemove', function (evt, d) {
        const mx = evt["layerX"];
        const my = evt["layerY"];
        tooltip
            .style("left", (mx + 15) + "px") 
            .style("top", (my + 15) + "px")
    })
.on('mouseout', function () {
  tooltip.html(``).style('visibility', 'hidden');
  d3.select(this).transition().attr('fill', hoverColor)
     .attr("d", d => createStarPath(xScale(d.income), yScale(d.score),0.5));
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
    .text("Gross income of the movie (in million dollars)");

graph.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("x", -height / 2)
    .attr("y", -15)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .style("font-size", "20px")
    .style("fill", "white")
    .text("Movie Score");

function transissionToSelectMovies(filteredData) {
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.income)])
        .range([padding.left, width - padding.right]);
    const yScale = d3.scaleLinear()
        .domain([0, 10])
        .range([height - padding.bottom, padding.top]);
    const xAxis = d3.axisBottom()
        .scale(xScale);
    const yAxis = d3.axisLeft()
        .scale(yScale);

    let path = graph.selectAll("path").data(filteredData);
    // Update existing circles
    path
        .transition()
        .attr("d", d => createStarPath(xScale(d.income), yScale(d.score),0.5))
    path.enter()
        .append("path")
        .attr("d", d => createStarPath(xScale(d.income), yScale(d.score),0.1))
        .attr("fill", hoverColor)
        .transition()
        .attr("d", d => createStarPath(xScale(d.income), yScale(d.score),0.5))
        path.exit()
            .transition()
                  .attr("d",d=> 
                      d === null ? d : createStarPath(prevXScale[0](d.income), yScale(d.score), 0.1)
                  )
                  
            .remove();
    prevXScale[0]=xScale;
    graph.select(".x.axis")
        .transition()
        .call(xAxis);
    graph.select(".y.axis")
        .transition()
        .call(yAxis);
    
    path = graph.selectAll("path"); // Re-select all circles after updating
    path.filter(d=>d!==null).on('mouseover', function (d, i) {
        tooltip
            .html(
              `<h1>${i.movie}</h1>
              <div>Score of movie: ${i.score}</div>
              <div>Income of movie: ${"$" + i.income + "M"}</div>`
            )
            .style('visibility', 'visible');
        d3.select(this).transition().attr('fill', staticColor).attr("d", d => createStarPath(xScale(d.income), yScale(d.score),0.6))
    })
    .on('mousemove', function (evt, d) {
        const mx = evt["layerX"];
        const my = evt["layerY"];
        tooltip
            .style("left", (mx + 15) + "px") 
            .style("top", (my + 15) + "px")
    })
    .on('mouseout', function () {
        tooltip.html(``).style('visibility', 'hidden');
        d3.select(this).transition().attr('fill', hoverColor).attr("d", d => createStarPath(xScale(d.income), yScale(d.score),0.5))
    });

}
```

<br>
<h2>Average gross income per year and per genre</h2>
<div style="display: flex; flex-direction: row; margin-top: 10px;">
    <label style="margin-right: 10px" for="yearSelect" >Select year:</label>
    <input type="range" id="yearSelect" min="0" max="10" step="0.1" value="0" style="width: 500px">
    <label id="yearText"></label>
</div>
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
let sorted = d3.sort(finishedFilter, d => d.year).filter(d => d.average_gross_genre.filter(t => t.average_gross != 0).length != 0)

// Graph marges
const margin = {top: 20, right: 20, bottom: 50, left: 50};
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Genres list
const genres = ['Action', 'Biography', 'Film-Noir', 'Western', 'Musical', 'Animation', 'Adventure', 'Crime', 'Comedy', 'Drama', 'Mystery', 'Horror', 'Fantasy'].sort()

// Create graph when selected
function updateChart(year) {
    const yearData = sorted.filter(d => d.year == year)[0].average_gross_genre

    // Add missing data for graph
    for (let temp of genres) {
        if (yearData.filter(d => d.genre == temp).length == 0) {
            yearData.push({genre: temp, average_gross: 0.0})
        }
    }

    // Remove already existing graph
    d3.select("#line-plot").selectAll("*").remove();
    
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

    // Add bars with transition
    svg.selectAll(".bar")
        .data(yearData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.genre))
        .attr("width", x.bandwidth())
        .attr("y", height)
        .attr("height", 0)
        .style("fill", "#69b3a2")
        .transition()
        .duration(1000)
        .delay((d, i) => i * 100)
        .attr("y", d => y(d.average_gross))
        .attr("height", d => height - y(d.average_gross));

    // Add money on top of bar with transition
    svg.selectAll(".income-text")
        .data(yearData)
        .enter().append("text")
        .attr("class", "income-text")
        .attr("x", d => x(d.genre) + x.bandwidth() / 2)
        .attr("y", height)
        .attr("text-anchor", "middle")
        .text(d => `$${d.average_gross}M`)
        .style("font-size", "12px")
        .style("fill", "white")
        .transition()
        .duration(1000)
        .delay((d, i) => i * 100)
        .attr("y", d => y(d.average_gross) - 5);

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

let currentYear = sorted[0].year;

// Slider for the range of activity
const YearText = d3.select("#yearText")
    .text(`${currentYear}`);

const Yearslider = d3.select("#yearSelect")
    .attr("min", sorted[0].year)
    .attr("max", sorted[sorted.length - 1].year)
    .attr("value", sorted[0].year)
    .attr("step", 1)
    .on("input", function () {
        currentYear = this.value;
        updateChart(currentYear);
        YearText.text(`${currentYear}`)
    })

// Default start value
updateChart(currentYear);
```

<br>
<h2>Average box-office per rating</h2>
For censor ratings "12" and "18+" the box-office is unknown. The box-office is in million dollars.
<div id="boxplots"></div>

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
censorBoxOffice['Not Rated'] = combinedArray

const order = ['Not Rated', '(Banned)', 'All', 'U', 'G', 'U/A', 'PG', 'PG-13', '7', 'UA 7+', 'UA', '12+', '13', 'UA 13+', '15+', '16', 'UA 16+', 'R', 'NC-17', '18', 'M/PG', 'A']
const boxOfficeData = [];
for (const censor of order) {
    if (censor !== 'Unrated' && censor !== '12' && censor !== '18+') {
        var data_sorted = censorBoxOffice[censor].sort(d3.ascending)
        var q1 = d3.quantile(data_sorted, .25)
        var median = d3.quantile(data_sorted, .5)
        var q3 = d3.quantile(data_sorted, .75)
        var interQuantileRange = q3 - q1
        var min = d3.min(censorBoxOffice[censor])
        var max = d3.max(censorBoxOffice[censor])
        boxOfficeData.push({
            censor: censor,
            minimum: min,
            maximum: max,
            q1: q1,
            median: median,
            q3: q3
        });
    }
}
```

```js
let global_max = d3.max(boxOfficeData, d => d.maximum)
let global_min = d3.min(boxOfficeData, d => d.minimum)
var margin = {top: 10, right: 30, bottom: 30, left: 60}
const width = 900
const height = 1000;

// append the svg object to the body of the page
var svg = d3.select("#boxplots")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

var tooltip = d3.select("#boxplots").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

var y = d3.scaleBand()
    .range([height, 0 ])
    .domain(order)
    .padding(.4);
  
svg.append("g")
    .call(d3.axisLeft(y).tickSize(0))
    .select(".domain").remove()

// Show the X scale
var x = d3.scaleLinear()
.domain([global_min, global_max])
.range([50, width])

svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks(5))

svg.selectAll("vertLines")
    .data(boxOfficeData)
    .enter()
    .append("line")
      .attr("x1", d => x(d.minimum))
      .attr("x2", d => x(d.maximum))
      .attr("y1", d => y(d.censor) + y.bandwidth()/2)
      .attr("y2", d => y(d.censor) + y.bandwidth()/2)
      .attr("stroke", "white")
      .style("width", 40)

// Add the tooltip
const box_tooltip = d3.select("#boxplots")
    .append('div')
    .attr('class', 'd3-tooltip')
    .style('position', 'absolute')
    .style('z-index', '10')
    .style('visibility', 'hidden')
    .style('padding', '10px')
    .style('background', 'rgba(0,0,0,1)')
    .style('border-radius', '4px')
    .style('color', '#fff')
    .style('left', "0px")
    .style('top', "0px")
    .text('a simple tooltip');

// rectangle for the main box
svg
.selectAll("boxes")
.data(boxOfficeData)
.enter()
.append("rect")
    .attr("x", d => x(d.q1))
    .attr("width", d => x(d.q3)-x(d.q1) != 0 ? x(d.q3)-x(d.q1) : 2)
    .attr("y", d => y(d.censor))
    .attr("height", y.bandwidth())
    .attr("stroke", "black")
    .style("fill", "#F5C518")
    .style("opacity", 0.3)
    .on('mouseover', function (d, i) {
        box_tooltip
            .html(
                `<h1>Rating: ${i.censor}</h1>
                <div>Min: $${i.minimum.toFixed(2)}M</div>
                <div>Q1: $${i.q1.toFixed(2)}M</div>
                <div>Median: $${i.median.toFixed(2)}M</div>
                <div>Q3: $${i.q3.toFixed(2)}M</div>
                <div>Max: $${i.maximum.toFixed(2)}M</div>`
            )
            .style('visibility', 'visible');
    })
    .on('mousemove', function (evt, d) {
        const mx = evt["layerX"];
        const my = evt["layerY"];
        box_tooltip
            .style("left", (mx + 15) + "px")
            .style("top", (my + 15) + "px")
    })
    .on('mouseout', function () {
        box_tooltip.html(``).style('visibility', 'hidden');
    });

// Show the median
svg
.selectAll("medianLines")
.data(boxOfficeData)
.enter()
.append("line")
  .attr("y1", d => y(d.censor))
  .attr("y2", d => y(d.censor) + y.bandwidth())
  .attr("x1", d => x(d.median))
  .attr("x2", d => x(d.median))
  .attr("stroke", "white")
  .style("width", 80)
```


<br>
<div style="position: relative; display: flex; flex-direction: row;">
    <h2>Average Movie score per</h2>
    <button id="actorButton" style="margin-left: 10px;
                    margin-right: 3px; 
                    padding-left: 15px;
                    padding-right: 15px;
                    font-size: 25px; 
                    font-family: Volkhov;
                    border-style: none;
                    border-radius: 20px;
                    color: black;
                    background-color: #eec42d">Actor</button>
    <button id="directorButton" style="margin-left: 5px;
                    margin-right: 3px; 
                    padding-left: 15px;
                    padding-right: 15px;
                    font-size: 25px; 
                    font-family: Volkhov;
                    border-style: none;
                    border-radius: 20px;
                    color: black;
                    background-color: #437c90">Director</button>
</div>
<br>
<i style="font-size: 20px; width: 1000px">
Genres and ratings play significant roles in a movie's success, but the cast and crew are equally vital.
When planning a movie, you strive to bring together an exceptional cast and talented directors. 
The scatter plot below explores the correlation between the average ratings of movies and
the number of films in which actors have appeared. 
This plot also provides insights into the quality of actors and directors based on these metrics.
</i>
<br>
<i style="font-size: 20px; width: 1000px">
The plot illustrates that a high average movie rating doesn't always mean that an actor has a large filmography. 
However, it does suggest that actors with a significant number of films usually have average scores in the 6.5-7.5 range. 
This pattern indicates that these actors often feature in movies with higher ratings but also appear in some lower-quality films. 
Essentially, it shows they've had a diverse career with both high-quality and lower-quality movies. 
Those with higher average ratings generally have shorter filmographies, 
possibly because they were lucky to be in a few well-received films or because they're underrepresented in our database.
</i>
<br>
<i style="font-size: 20px; width: 1000px">
When looking at the data points that represents actors or directors with higher movie counts, 
you'll find some of the most famous names in the industry. Actors like Samual L. Jackson, Brad Pitt and Ryan Gosling and
directors like Steven Spielberg and Christopher Nolan.
</i>
<br>
<i style="font-size: 20px; width: 1000px">
The scatter plot features a broad range of actors and directors, but you can explore specific names by using the search bar. 
If you want to focus on more recent activity, you can filter by the time period in which they were active—for example,
excluding those who last worked in the 1960s. Additionally, you can adjust the plot's display by setting a minimum average score and
a minimum number of movies to concentrate on individuals with higher ratings and more extensive filmographies.
</i>
<br>

<div id="my_dataviz" style="position: relative; display: flex; flex-direction: column; width: 1000px">
    <div style="display: flex; flex-direction: row; margin-top: 10px;">
        <label style="margin-top: 5px; margin-right: 10px" for="artist">Search Artist:</label>
        <input type="text" id="artist" style="border-radius: 10px; padding: 7px">
    </div>
    <div style="display: flex; flex-direction: row; margin-top: 10px;">
        <label style="margin-right: 10px" for="myRange">Range of activity:</label>
        <input type="range" id="myRange" min="0" max="10" step="0.1" value="0" style="width: 500px">
        <label id="rangeText"></label>
    </div>
    <div style="display: flex; flex-direction: row; margin-top: 10px;">
        <label style="margin-right: 10px" for="myRangeScore">Minimum score:</label>
        <input type="range" id="myRangeScore" min="0" max="10" step="0.1" value="0" style="width: 500px">
        <label id="rangeScoreText"></label>
    </div>
    <div style="display: flex; flex-direction: row; margin-top: 10px;">
        <label style="margin-right: 10px" for="myRangeCount">Minimum amount of movies:</label>
        <input type="range" id="myRangeCount" min="0" max="10" step="0.1" value="0" style="width: 500px">
        <label id="rangeCountText"></label>
    </div>
    
</div>

```js
import * as Plot from "npm:@observablehq/plot";
import {
    loadActorsPerScoreAndMovieCount,
    loadDirectorsPerScoreAndMovieCount
} from "./components/average-movie-score-loader.js"

// Variables
const [EarliestYear, LatestYear] = d3.extent(movies, d => d.Year);
var currentYear = EarliestYear;
var currentSearch = "";
var currentMinScore = 0;
var currentMinCount = 1;
var showingExamples = true;
const actordata = loadActorsPerScoreAndMovieCount(movies);
const directordata = loadDirectorsPerScoreAndMovieCount(movies);
let actorSelected = true;
const width = 1000;
const height = 1000;
const hoverColor = '#437c90';
const staticColor = '#eec42d';
const defaultButtonColor = "#C2C2C2";
const activeButtonColor = "#eec42d";
const padding = {top: 20, left: 30, right: 40, bottom: 30};

// Style buttons
const actorButton = d3.select("#actorButton");
const directorButton = d3.select("#directorButton");
actorButton.style("background-color", activeButtonColor); // Actors is active initially
directorButton.style("background-color", defaultButtonColor);


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

const ryanGoslingTooltip = d3.select("#my_dataviz")
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
    .html(
        `<h1>Ryan Gosling</h1>
        <div>Amount of movies: 21</div>
        <div>Average movie score: 7.13</div>`
    )
    .style('visibility', 'visible')
    .style("left", "355px")
    .style("top", "315px");

const SamuelLJacksonTooltip = d3.select("#my_dataviz")
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
    .html(
        `<h1>Samuel L. Jackson</h1>
        <div>Amount of movies: 48</div>
        <div>Average movie score: 6.61</div>`
    )
    .style('visibility', 'visible')
    .style("left", "760px")
    .style("top", "360px");

// Create the SVG for scatter plot
const graph = d3.select("#my_dataviz")
    .append("svg")
    .attr("viewBox", [0, 0, width, height + padding.bottom])
    .attr("width", width)
    .attr("height", height)
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; position: relative")

// Add the search bar to filter the data
const search = d3.select("#artist")
    .on("input", function () {
        currentSearch = this.value;
        let filteredData = filterData();
        transissionToOtherData(filteredData);
    });

// Slider for the range of activity
const YearText = d3.select("#rangeText")
    .text(`${currentYear}-${LatestYear}`);

const Yearslider = d3.select("#myRange")
    .attr("min", EarliestYear)
    .attr("max", LatestYear)
    .attr("value", EarliestYear)
    .attr("step", 1)
    .on("input", function () {
        currentYear = this.value;
        let filteredData = filterData();
        YearText.text(`${currentYear}-${LatestYear}`);
        transissionToOtherData(filteredData);
    });

// Slider for the minimum score
const rangeScoreText = d3.select("#rangeScoreText")
    .text(`0-10`);

const rangeScoreSlider = d3.select("#myRangeScore")
    .attr("min", 0)
    .attr("max", 10)
    .attr("value", 0)
    .attr("step", 0.1)
    .on("input", function () {
        currentMinScore = this.value;
        let filteredData = filterData();
        rangeScoreText.text(`${currentMinScore}-10`);
        transissionToOtherData(filteredData);
    });

// Slider for the minimum amount of movies
const rangeCountText = d3.select("#rangeCountText")
    .text(`${d3.min(actordata, d => d.movies_count)}-${d3.max(actordata, d => d.movies_count)}`);

const rangeCountSlider = d3.select("#myRangeCount")
    .attr("min", d3.min(actordata, d => d.movies_count))
    .attr("max", d3.max(actordata, d => d.movies_count))
    .attr("value", d3.min(actordata, d => d.movies_count))
    .attr("step", 1)
    .on("input", function () {
        currentMinCount = this.value;
        rangeCountText.text(`${currentMinCount}-${d3.max(actordata, d => d.movies_count)}`);
        let filteredData = filterData();
        transissionToOtherData(filteredData);
    });

// Add the buttons to switch between actor and director
actorButton.on("click", function () {
    actorSelected = true;
    actorButton.style("background-color", activeButtonColor);
    directorButton.style("background-color", defaultButtonColor);
    let filteredData = filterData();
    transissionToOtherData(filteredData);
});

directorButton.on("click", function () {
    actorSelected = false;
    actorButton.style("background-color", defaultButtonColor);
    directorButton.style("background-color", activeButtonColor);
    let filteredData = filterData(currentYear);
    transissionToOtherData(filteredData);
});

const xScale = d3.scaleLinear()
    .domain([d3.min(actordata, d => d.movies_count), d3.max(actordata, d => d.movies_count)])
    .range([padding.left, width - padding.right]);

const yScale = d3.scaleLinear()
    .domain([d3.min(actordata, d => d.mean_score - 1), 10])
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
    .attr("r", (d) => { 
        if (d.artist === "Ryan Gosling") {
            return 6;
        } else if (d.artist === "Samuel L. Jackson") {
            return 6;
        }
        return 4;
    })
    .attr("fill", (d) => {
        if (d.artist === "Ryan Gosling") {
            return "#FF0000";
        } else if (d.artist === "Samuel L. Jackson") {
            return "#FF0000";
        }
        return staticColor;
    })
    .on('mouseover', function (d, i) {
        if (showingExamples) {
            ryanGoslingTooltip.html(``).style('visibility', 'hidden');
            SamuelLJacksonTooltip.html(``).style('visibility', 'hidden');
            graph.selectAll("circle").transition().attr('fill', staticColor).attr("r", 4);
            showingExamples = false;
        }
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
        const mx = evt["layerX"];
        const my = evt["layerY"];
        tooltip
            .style("left", (mx + 10) + "px")
            .style("top", (my + 30) + "px")
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

function filterData() {
    if (showingExamples) {
        ryanGoslingTooltip.html(``).style('visibility', 'hidden');
        SamuelLJacksonTooltip.html(``).style('visibility', 'hidden');
        graph.selectAll("circle").attr('fill', staticColor).attr("r", 4);
        showingExamples = false;
    }
    let data = actordata
    if (!actorSelected) {
        data = directordata;
    }
    let filteredData = data.filter(d => d.last_year_active >= currentYear);
    filteredData = filteredData.filter(d => d.mean_score >= currentMinScore);
    filteredData = filteredData.filter(d => d.movies_count >= currentMinCount);
    let finalData = filteredData.filter(d => d.artist.toLowerCase().includes(currentSearch.toLowerCase()));
    if (currentSearch === "") {
        finalData = filteredData;
    }
    return finalData;
}

function transissionToOtherData(filteredData) {
    const xScale = d3.scaleLinear()
        .domain([d3.min(filteredData, d => d.movies_count), d3.max(filteredData, d => d.movies_count)])
        .range([padding.left, width - padding.right]);
    const yScale = d3.scaleLinear()
        .domain([d3.min(filteredData, d => d.mean_score - 1), 10])
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
        .attr("r", 4)
        .transition()
        .attr("r", 4)
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
            const mx = evt["layerX"];
            const my = evt["layerY"];
            tooltip
                .style("left", (mx + 10) + "px")
                .style("top", (my + 30) + "px")
        })
        .on('mouseout', function () {
            tooltip.html(``).style('visibility', 'hidden');
            d3.select(this).transition().attr('fill', staticColor).attr("r", 4);
        });
}
```



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
let groupedData;
let maxMovies;
let totalGrossData;
let groupedByGenre;
const color = d3.scaleOrdinal([...new Set(movies.map(d => d.main_genre))], d3.schemeSet3);
const groupData = by => {
    groupedData = d3.group(movies, d => d.main_genre, d => d[by]);
    totalGrossData = [];
    maxMovies = 0;
    groupedData.forEach((directors, mainGenre) => {
        directors.forEach((movies, director) => {
            const totalGross = parseFloat(d3.sum(movies, d => parseFloat(d.Total_Gross.match(/[0-9.]+/))).toFixed(2));
            if (totalGross > 0) {
                const moviesMade = movies.length;
                if (moviesMade > maxMovies) maxMovies = moviesMade;
                const averageGross = (totalGross / moviesMade).toFixed(2);
                if (director.startsWith('Directors:')) director = director.split('Directors:')[1];
                totalGrossData.push({ mainGenre, director, averageGross, moviesMade });
            }
        });
    });
    groupedByGenre = d3.group(totalGrossData, d => d.mainGenre);
};
groupData('Director');

const width = 900;
const height = 800;
const buildTreemap = leaves => {
    treemap.selectAll("g").remove();
    const leaf = treemap.selectAll("g")
        .data(leaves, d => d.data.director)
        .join("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);
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
    leaf.on("mouseover", function(d) {
        const clickedRect = d3.select(this).select("rect");
        const isHighlighted = clickedRect.attr("fill-opacity") === "1";
        if (!isHighlighted) {
            leaf.selectAll("rect").attr("fill-opacity", 0.6);
            clickedRect.attr("fill-opacity", 1);
        }
        const data = clickedRect._groups[0][0].__data__.data;
        treemapTool.html(`<h1>${data.mainGenre}</h1>
        <div>${actorSelected ? 'Actor(s)' : 'Director(s)'}: ${data.director}</div>
        <div>Average Income Per Movie: $${data.averageGross}M</div>
        <div>Movies Made In Genre: ${data.moviesMade}</div>`).style('visibility', 'visible');
    }).on('mousemove', function (evt, d) {
        const mx = evt["layerX"];
        const my = evt["layerY"];
        treemapTool
            .style("left", (mx + 15) + "px")
            .style("top", (my + 15) + "px")
    })
    .on('mouseout', function () {
        leaf.selectAll("rect").attr("fill-opacity", 0.6);
        treemapTool.html(``).style('visibility', 'hidden');
    });
    const textLeaf = treemap.selectAll("g").filter(d => {
        return ((d.x1 - d.x0) > 50 && (d.y1 - d.y0) > 32);
    });
    textLeaf.append("text")
        .attr("clip-path", d => d.clipUid)
        .selectAll("tspan")
        .data(d => [`$${format(d.value)}M`])
        .join("tspan")
        .attr("x", 3)
        .attr("y", (d, i, nodes) => `${1.1 + i * 0.9}em`)
        .attr("font-size", 13)
        .attr("font-weight", "bold")
        .attr("fill-opacity", (d, i, nodes) => null)
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
};

let treemapLayout = d3.treemap()
    .tile(d3.treemapSquarify)
    .size([width, height])
    .padding(1)
    .round(true);

let top10PerGenre = new Map();
groupedByGenre.forEach((values, genre) => {
    let sortedValues = values.slice().sort((a, b) => b.averageGross - a.averageGross);
    top10PerGenre.set(genre, sortedValues.slice(0, 10));
});
let root = d3.hierarchy({children: Array.from(top10PerGenre, ([key, value]) => ({ mainGenre: key, children: value }))})
    .sum(d => d.averageGross)
    .sort((a, b) => b.value - a.value);

treemapLayout(root);
let actorSelected = false;
let counter = 0;
function generateUniqueId() {
    return `id_${counter++}`;
}

let treemap = d3.create("svg")
  .attr("viewBox", [0, 0, width, height])
  .attr("width", width)
  .attr("height", height)
  .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

const treemapTool = d3.select("#treemap")
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
    .text('');

const format = d3.format(",d");
buildTreemap(root.leaves());

Object.assign(treemap.node(), {scales: {color}});
let legend = Swatches(color);
let vis = false;

const displayingActor = true;
const slider = document.getElementById("slider");
slider.max = maxMovies;
const value = document.getElementById("value");
const lspan = document.getElementById("lspan");

slider.addEventListener("input", function() {
    const filterValue = +this.value;
    value.textContent = filterValue;
    filterNodesByMoviesMade(filterValue);
});

const filterNodesByMoviesMade = minMoviesMade => {
    let top10PerGenre = new Map();
    groupedByGenre.forEach((values, genre) => {
        let sortedValues = values.slice().sort((a, b) => b.averageGross - a.averageGross).filter(d => d.moviesMade >= minMoviesMade);
        top10PerGenre.set(genre, sortedValues.slice(0, 10));
    });
    let root = d3.hierarchy({children: Array.from(top10PerGenre, ([key, value]) => ({ mainGenre: key, children: value }))})
        .sum(d => d.averageGross)
        .sort((a, b) => b.value - a.value);
    const filteredLeaves = root.leaves();
    treemapLayout(root);
    buildTreemap(filteredLeaves);
}

const actorButton = d3.select("#treeActor");
const directorButton = d3.select("#treeDirector");
directorButton.style("background-color", activeButtonColor);
actorButton.style("background-color", defaultButtonColor);

actorButton.on("click", function () {
    if (!actorSelected) {
        actorSelected = true;
        actorButton.style("background-color", activeButtonColor);
        directorButton.style("background-color", defaultButtonColor);
        groupData('Actors');
        slider.max = maxMovies;
        slider.value = 1;
        value.textContent = 1;
        lspan.innerHTML = 'Actor';
        filterNodesByMoviesMade(1);
    }
});

directorButton.on("click", function () {
    if (actorSelected) {
        actorSelected = false;
        actorButton.style("background-color", defaultButtonColor);
        directorButton.style("background-color", activeButtonColor);
        groupData('Director');
        slider.max = maxMovies;
        slider.value = 1;
        value.textContent = 1;
        lspan.innerHTML = 'Director';
        filterNodesByMoviesMade(1);
    }
});
```

<br><br>
<div style="position: relative; display: flex; flex-direction: row;">
    <h2>Most successful</h2>
    <button id="treeDirector" style="margin-left: 10px;
                    margin-right: 3px; 
                    padding-left: 15px;
                    padding-right: 15px;
                    font-size: 25px; 
                    font-family: Volkhov;
                    border-style: none;
                    border-radius: 20px;
                    color: black;
                    background-color: #eec42d">Director</button>
    <button id="treeActor" style="margin-left: 5px;
                    margin-right: 3px; 
                    padding-left: 15px;
                    padding-right: 15px;
                    font-size: 25px; 
                    font-family: Volkhov;
                    border-style: none;
                    border-radius: 20px;
                    color: black;
                    background-color: #437c90">Actor</button>
    <h2 style="margin-left: 10px;">per movie genre</h2>
</div>
<br>
<i style="font-size: 20px; margin-top: 5px; width: 1000px">
Finally, it also makes sense to review the best performing directors and actors categorized by movie genre.
By using a treemap we visualize exactly this such that the best performing directors and actors, based on their average revenue
per movie, can quickly be spotted.
</i>
<br>
<i style="font-size: 20px; margin-top: 5px; width: 1000px">
With this information we hope to provide a good insight into which actors and directors seem promising choices for
a desired movie genre. By filtering on the amount of movies a director or actor has made, a more stable decision
can be made: it will show those actors and directors that perform well on average even after making more movies.
This gets rid of outliers that have directed or played in only one very good performing movie.
</i>
<br>
<i style="font-size: 20px; margin-top: 5px; width: 1000px">
As an example, this plot quickly makes clear that action and animation are genres that could be good choices for
a movie studio: the best performing directors and actors can be found in these categories and thus most money
can probably be made in these genres, given that one of the better actors in the genre is chosen.
</i>
<br>
<div>${legend}</div>
<div id="sliderDiv">
  <label for="slider">Minimum <span id="lspan">Director</span> Movie Count In Genre:</label>
  <input type="range" min="1" max="1" value="0" id="slider">
  <span id="value">1</span>
</div>
<div id="treemap">${treemap}</div>
</div>