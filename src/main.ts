import {  Application, 
          Assets, 
          Sprite, 
          Texture, 
          Container, 
          BlurFilter,
          Graphics,
          FillGradient,
          Color, 
          TextStyle,
          Text,
        } from "pixi.js";
        import { SlotHelper } from './slotHelper.js'; // Import the Slot Helper Library

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#D896FF", resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  await Assets.load([
    'assets/gem_blue.png',
    'assets/gem_green.png',
    'assets/gem_yellow.png',
    'assets/gem_purple.png',
    'assets/gem_red.png',
  ]);

  const reel_width = 160;
  const symbol_width = 150;

  const reel_count = 5;
  const symbol_count = 5;

  const slotTextures = [
    Texture.from('assets/gem_blue.png'),
    Texture.from('assets/gem_green.png'),
    Texture.from('assets/gem_yellow.png'),
    Texture.from('assets/gem_purple.png'),
    Texture.from('assets/gem_red.png'),
  ];

  const reels: any[] = [];
  const reelsContainer = new Container();

  for(let i = 0; i < reel_count; i++)
  {
    // Defining reels
    const rc = new Container();
    // Adjusting reel width
    rc.x = i * reel_width;

    reelsContainer.addChild(rc);

    const reel = {
      container: rc,
      symbols: [] as Sprite[],
      position: 0,
      previousPosition: 0,
      blur: new BlurFilter(),
    };

    reel.blur.blurX = 0;
    reel.blur.blurY = 0;
    rc.filters = [reel.blur];

    for(let j = 0; j < symbol_count; j++)
    {
        // randomly select a symbol
        const symbol = new Sprite(slotTextures[Math.floor(Math.random() * slotTextures.length)]);
        // position the symbol
        symbol.y = j * symbol_width;
        // scale the symbol to fit symbol_width
        symbol.scale.x = symbol.scale.y = Math.min(symbol_width / symbol.width, symbol_width / symbol.height);
        // center the symbol
        symbol.x = Math.round((symbol_width - symbol.width) / 2);
        reel.symbols.push(symbol);
        rc.addChild(symbol);
    }
    reels.push(reel);
  }

  app.stage.addChild(reelsContainer);

  // setting margin
  const margin = (app.screen.height - symbol_width * 4) / 2;
  reelsContainer.y = margin;
  reelsContainer.x = Math.round(app.screen.width / 2 - (reel_width * reel_count) / 2);
  // build tap and botto covers

  const top = new Graphics().rect(0, 0, app.screen.width, margin).fill({color: 0x800080});
  const bottom = new Graphics().rect(0, symbol_width * 4 + margin, app.screen.width, margin).fill({color: 0x800080});

  // add gradient to the top and bottom covers
  const fill = new FillGradient(0, 0, 0, 2);
  const colors = [0xffffff, 0xFEDEBE].map((color) => Color.shared.setValue(color).toNumber());

  colors.forEach((number, index) =>
  {
    const ratio = index / colors.length;
    fill.addColorStop(ratio, number);
  });

  // Adding Text 
  const style = new TextStyle({
    fontFamily: 'Lato',
    fontSize: 32,
    fontStyle: 'italic',
    fontWeight: 'bold',
    fill: { fill },
    stroke: { color: 0x4a1850, width: 5 },
    dropShadow: {
        color: 0x000000,
        angle: Math.PI / 6,
        blur: 4,
        distance: 6,
    },
    wordWrap: true,
    wordWrapWidth: 440,
  });

  // Adding Text to the bottom cover
  const playText = new Text('Spin the wheels!', style);
  
  playText.x = Math.round((bottom.width - playText.width) / 2);
  playText.y = app.screen.height - margin + Math.round((margin - playText.height) / 2);
  bottom.addChild(playText);

  const headerText = new Text('Crystal Gem Slot!', style);

  // Adding Text to the top cover
  headerText.x = Math.round((top.width - headerText.width) / 2);
  headerText.y = Math.round((margin - headerText.height) / 2);
  top.addChild(headerText);

  app.stage.addChild(top);
  app.stage.addChild(bottom);


  // button interactivity
  bottom.eventMode = 'static';
  bottom.cursor = 'pointer';
  bottom.addListener('pointerdown', () => {
    startPlay();
  });

  let gameRunning = false;  
  function startPlay()
  {
    if(gameRunning) return;
    gameRunning = true;

    for(let i = 0; i < reels.length; i++)
    {
      const r = reels[i];
            const extra = Math.floor(Math.random() * 3);
            const target = r.position + 10 + i * 5 + extra;
            const time = 800 + i * 150 + extra * 150; // Faster spin duration

            SlotHelper.tweenTo(r, 'position', target, time, SlotHelper.backout(0.8), null, i === reels.length - 1 ? reelsComplete : null);
    }
  }
  // Reels done handler.
  function reelsComplete()
  {
      gameRunning = false;
  }
  // Listen for animate update.
  app.ticker.add(() =>
    {
        // Update the slots.
        for (let i = 0; i < reels.length; i++)
        {
            const r = reels[i];
            // Update blur filter y amount based on speed.
            // This would be better if calculated with time in mind also. Now blur depends on frame rate.

            r.blur.blurY = (r.position - r.previousPosition) * 64;
            r.previousPosition = r.position;

            // Update symbol positions on reel.
            for (let j = 0; j < r.symbols.length; j++)
            {
                const s = r.symbols[j];
                const prevy = s.y;

                s.y = ((r.position + j) % r.symbols.length) * symbol_width - symbol_width;
                if (s.y < 0 && prevy > symbol_width)
                {
                    // Detect going over and swap a texture.
                    // This should in proper product be determined from some logical reel.
                    s.texture = slotTextures[Math.floor(Math.random() * slotTextures.length)];
                    s.scale.x = s.scale.y = Math.min(symbol_width / s.texture.width, symbol_width / s.texture.height);
                    s.x = Math.round((symbol_width - s.width) / 2);
                }
            }
        }
        SlotHelper.updateTweens();
    });

})();
