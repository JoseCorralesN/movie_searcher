import React, { useEffect, useState } from 'react'
import Search from './components/Search'
import Spinner from './components/Spinner';
import MovieCard from './components/MovieCard';
import {useDebounce} from "react-use";
import { getTrendingMovies, updateSearchCount } from './appwrite';

const API_BASE_URL = "https://api.themoviedb.org/3"
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`
  }
}

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [movieList, setMovieList] = useState([]);
  const [trendingMovieList, setTrendingMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useDebounce(()=>setDebouncedSearchTerm(searchTerm),500, [searchTerm])

  const fetchMovies = async (query) =>{
    try{
      const endpoint = query ? 
      `/api/search/movie?query=${encodeURIComponent(query)}` 
      :
      `/api/discover/movie?include_adult=true&include_video=false&language=en-US&page=1&sort_by=popularity.desc` ;
      setMovieList([])
      const response = await fetch(endpoint,API_OPTIONS);

      if(!response.ok){
        throw new Error("Fail to fetch movies");
      }

      const data = await response.json();

      if(data.response === "False"){
        setErrorMessage(data.Error || "Fail to fetch movies")
      }else{
        setMovieList(data.results);

        if(query && data.results.length > 0){
          await updateSearchCount(query, data.results[0]);
        }
      }

    }catch(error){
      console.error(error);
      setErrorMessage(errorMessage);
    }finally{
      setIsLoading(false)
    }
  }

  const getTredingMovieList = async () =>{
    try {
      const movieList = await getTrendingMovies();
      console.warn({movieList});
      if(movieList && movieList.length > 0){
        setTrendingMovieList(movieList);
      }
    } catch (error) {
      console.log({error})
    }
  }

  useEffect(()=>{
    getTredingMovieList();
  },[])

  useEffect(()=>{
    fetchMovies(debouncedSearchTerm);
  },[debouncedSearchTerm])

  return (
    <main>
      <div className='pattern'></div>
      <div className='wrapper'>
        <header>
          <img src='./hero.png' alt="Hero Banner"/>
          <h1>Fin <span className='text-gradient'>Movies</span> You'll Enjoy Without the Hassle</h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}></Search>
        </header>
        {
          trendingMovieList.length>0 &&
          <section className='trending'>
            <h2>Trending Movies</h2>
            <ul>
              {
                trendingMovieList.map((movie, index) => (
                  <li key={movie.$id}>
                    <p>{index+1}</p>
                    <img src={movie.poster_url} alt={movie.title}/>
                  </li>
                )) 
              }
            </ul>
          </section>
        }
        <section className='all-movies'>
          <h2 className='mt-4'>All Movies</h2>
          {isLoading ? <Spinner></Spinner> :
          <ul>
            {
              movieList.map((movie)=>{
                  return(
                    <MovieCard key={movie.id} movie={movie}></MovieCard>
                  )
              })
            }
          </ul>}
          {errorMessage && <p className='text-red-500'>{errorMessage}</p>}
        </section>
      </div>
    </main>
  )
}

export default App