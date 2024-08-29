const songs = [
    { id: '1', name: 'Shape of You', artist: 'Ed Sheeran' },
    { id: '2', name: 'Blinding Lights', artist: 'The Weeknd' },
    { id: '3', name: 'Dance Monkey', artist: 'Tones and I' },
    // Add more songs as needed
  ];
  
  module.exports = {
    search: (query) => {
      return songs.filter(song => 
        song.name.toLowerCase().includes(query.toLowerCase()) ||
        song.artist.toLowerCase().includes(query.toLowerCase())
      );
    },
    getSongDetails: (id) => {
      return songs.find(song => song.id === id);
    }
  };