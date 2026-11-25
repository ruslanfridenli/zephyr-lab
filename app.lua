
W=110 H=62 CELL=0
cells={} next_cells={} frame_data=""
mode="ca" rule=30 seed=1
gen=0
function rnd() seed=(seed*1103515245+12345)%2147483648 return seed/2147483648 end
function idx(x,y) return y*W+x end
function init()
  cells={};next_cells={}
  for i=0,W*H-1 do cells[i]=rnd()<0.22 and 1 or 0 end
  -- seed a glider-ish pattern center
  local cx,cy=W//2,H//2
  cells[idx(cx,cy)]=1 cells[idx(cx+1,cy+1)]=1 cells[idx(cx+2,cy)]=1 cells[idx(cx,cy+2)]=1 cells[idx(cx+1,cy+2)]=1
  gen=0
end
function cell(x,y)
  if x<0 or y<0 or x>=W or y>=H then return 0 end
  return cells[idx(x,y)]or 0
end
function birth(x,y)
  local s=cell(x,y)
  if mode=="ca" then
    -- elementary ca: 3-cell neighborhood of previous row -> rule bit
    local bits=cell(x-1,y)*4+cell(x,y)*2+cell(x+1,y)
    return math.floor(rule/2^bits)%2
  end
  -- game of life: 3x3 neighborhood
  local n=0
  for dy=-1,1 do for dx=-1,1 do
    if not(dx==0 and dy==0) then n=n+cell(x+dx,y+dy) end
  end end
  if s==1 then return (n==2 or n==3) and 1 or 0 end
  return n==3 and 1 or 0
end
function tick()
  for y=0,H-1 do for x=0,W-1 do next_cells[idx(x,y)]=birth(x,y) end end
  cells,next_cells=next_cells,cells
  gen=gen+1
  local out={}
  for y=0,H-1 do
    local row={}
    for x=0,W-1 do row[#row+1]=cells[idx(x,y)] end
    out[#out+1]=table.concat(row)
  end
  frame_data=table.concat(out,"|")
end
init()