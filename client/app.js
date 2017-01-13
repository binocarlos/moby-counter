(function(){

  var width = 110
  var height = 100
  var connectionStatus = true
  var dataLoaded = true

  function add_whale(x, y, animate){
    var holder = document.getElementById('holder')
    var elem = document.createElement('div')
    $(elem).addClass('whale')
    $(elem).css({
      left:x + 'px',
      top:y + 'px',
      width:width + 'px',
      height:height + 'px'
    })
    if(animate){
      $(elem).addClass('animated tada');  
    }
    holder.appendChild(elem)
  }

  function handle_click(e){
    if(!connectionStatus) return
    var offset = $(this).offset();
    var x = e.pageX - offset.left - (width/2);
    var y = e.pageY - offset.top - (height/2);
    add_whale(x, y, true)
  }

  $(function(){
    $('#holder').click(handle_click)
    $('#preloader').hide()
  })

})()
