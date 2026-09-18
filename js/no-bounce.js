if(window.Hassad){
  Hassad.requireAuth=function(){
    try{return JSON.parse(localStorage.getItem("hassad-user")||"null")}catch(e){return null}
  };
}
