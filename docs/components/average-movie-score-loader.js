import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";

// Load the data for the average movie score per actor
export function loadActorsPerScoreAndMovieCount(movies) {
    const actorScores = {};
    const actorMoviesCount = {};
    const actorLastMovieYear = {};
    let groupData = d3.group(movies, d => d.Actors)
    console.log(groupData);
    groupData.forEach((movies, actor) => {
        const actors = actor.split(',');
        for (let i = 0; i < actors.length; i++) {
            actors[i] = actors[i].trim();
            if (actorScores[actors[i]] === undefined) {
                actorScores[actors[i]] = [];
                actorMoviesCount[actors[i]] = 0;
                actorLastMovieYear[actors[i]] = 0;
            }
            for (let j = 0; j < movies.length; j++) {
                actorScores[actors[i]].push(parseFloat(movies[j].Rating));
                actorMoviesCount[actors[i]]++;
                if (parseInt(movies[j].Year) > actorLastMovieYear[actors[i]]) {
                    actorLastMovieYear[actors[i]] = parseInt(movies[j].Year);
                }
            }
        }
    });

    const actorData = [];
    for (const actor in actorScores) {
        actorData.push({
            "artist": actor,
            "mean_score": d3.mean(actorScores[actor]),
            "movies_count": actorMoviesCount[actor],
            "last_year_active": actorLastMovieYear[actor]
        });
    }
    return actorData;
}

// Load the data for the average movie score per director
export function loadDirectorsPerScoreAndMovieCount(movies) {
    const directorScores = {};
    const directorMoviesCount = {};
    const directorLastMovieYear = {};
    let groupData = d3.group(movies, d => d.Director)

    groupData.forEach((movies, director) => {
        if (director.startsWith('Directors:')) director = director.split('Directors:')[1];
        const directors = director.split(',');
        for (let i = 0; i < directors.length; i++) {
            directors[i] = directors[i].trim();
            if (directorScores[directors[i]] === undefined) {
                directorScores[directors[i]] = [];
                directorMoviesCount[directors[i]] = 0;
                directorLastMovieYear[directors[i]] = 0;
            }
            for (let j = 0; j < movies.length; j++) {
                directorScores[directors[i]].push(parseFloat(movies[j].Rating));
                directorMoviesCount[directors[i]]++;
                if (parseInt(movies[j].Year) > directorLastMovieYear[directors[i]]) {
                    directorLastMovieYear[directors[i]] = parseInt(movies[j].Year);
                }
            }
        }
    });

    const directorData = [];
    for (const director in directorScores) {
        directorData.push({
            "artist": director,
            "mean_score": d3.mean(directorScores[director]),
            "movies_count": directorMoviesCount[director],
            "last_year_active": directorLastMovieYear[director]
        });
    }
    return directorData;
}