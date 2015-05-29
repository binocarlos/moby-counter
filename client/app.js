var width = 110
var height = 100

function load_data(done){
  $.get('/v1/whales', function(data){

    var ret = data.map(function(st){
      var parts = st.split(':')
      return {
        x:parts[0],
        y:parts[1]
      }
    })

    done(ret)
  
  })
}

function add_data(x, y, done){
  $.post('/v1/whales', x + ':' + y, done)
}

function add_whale(x, y){
  var holder = document.getElementById('holder')
  var elem = document.createElement('div')
  $(elem).addClass('whale')
  $(elem).css({
    left:x + 'px',
    top:y + 'px',
    width:width + 'px',
    height:height + 'px'
  })
  holder.appendChild(elem)
}

$(function(){
  load_data(function(data){
    data.forEach(function(pos){
      add_whale(pos.x, pos.y)
    })

    $('#holder').click(function(e){
      var offset = $(this).offset();
      var x = e.pageX - offset.left - (width/2);
      var y = e.pageY - offset.top - (height/2);
      add_data(x, y, function(){
        add_whale(x, y)
      })
    })
  })
})