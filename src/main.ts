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
        import { GlowFilter } from "@pixi/filter-glow";
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
    'assets/1.png',
    'assets/2.png',
    'assets/3.png',
    'assets/4.png',
    'assets/5.png',
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
  const buttonTextures = [
    Texture.from('assets/1.png'),
    Texture.from('assets/2.png'),
    Texture.from('assets/3.png'),
    Texture.from('assets/4.png'),
    Texture.from('assets/5.png'),
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
    // for (let j = 0; j < symbol_count; j++) {
    //   // Use a fixed texture for testing (middle row is all green gems)
    //   const texture = j === 1 ? slotTextures[0] : slotTextures[Math.floor(Math.random() * slotTextures.length)];
    //   const symbol = new Sprite(texture);
    //   symbol.y = j * symbol_width;
    //   symbol.scale.x = symbol.scale.y = Math.min(symbol_width / symbol.width, symbol_width / symbol.height);
    //   symbol.x = Math.round((symbol_width - symbol.width) / 2);
    //   reel.symbols.push(symbol);
    //   rc.addChild(symbol);
    // }
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

    clearWins();

    for(let i = 0; i < reels.length; i++)
    {
        const r = reels[i];
        const extra = Math.floor(Math.random() * 3);
        const target = r.position + 10 + i * 5 + extra;
        const time = 800 + i * 150 + extra * 150; // Faster spin duration

        SlotHelper.tweenTo(r, 'position', target, time, SlotHelper.backout(0.8), null, i === reels.length - 1 ? reelsComplete : null);
    }
    //reelsComplete();
    // spinReels(() => {
    //   // After spinning, stop the reels in a configuration where the first row matches
    //   stopReelsWithFirstRowMatch();
    // });
  }

  function spinReels(onComplete: () => void) {
    const spinDuration = 2000; // 2 seconds
    const spinStartTime = Date.now();

    const spin = () => {
      const elapsed = Date.now() - spinStartTime;
      const progress = Math.min(elapsed / spinDuration, 1);

      // Move the reels randomly during the spin
      for (let i = 0; i < reels.length; i++) {
        const reel = reels[i];
        reel.position += 0.1 + Math.random() * 0.2; // Random movement
        updateReelPosition(reel);
      }

      if (progress < 1) {
        requestAnimationFrame(spin);
      } else {
        onComplete();
      }
    };

    spin();
  }

  function stopReelsWithFirstRowMatch() {
    // Define the desired pattern for the first row
    const firstRowPattern = [1, 1, 1, 1, 1]; // All symbols in the first row are blue gems

    for (let i = 0; i < reels.length; i++) {
      const reel = reels[i];
      reel.position = firstRowPattern[i]; // Set the position to match the first row pattern
  
      // Update the symbols in the reel
      for (let j = 0; j < reel.symbols.length; j++) {
        const symbol = reel.symbols[j];
        if (j === 0) {
          symbol.texture = slotTextures[0]; // Set the texture to match the first row pattern
        }
      }
      updateReelPosition(reel);
    }

    // Simulate the reels stopping
    //reelsComplete();
  }

  function updateReelPosition(reel: any) {
    // Wrap the position to keep it within the symbol count
  reel.position = reel.position % reel.symbols.length;
  if (reel.position < 0) reel.position += reel.symbols.length;

  // Update the blur filter based on the speed
  reel.blur.blurY = (reel.position - reel.previousPosition) * 8;
  reel.previousPosition = reel.position;

  // Update symbol positions
  for (let j = 0; j < reel.symbols.length; j++) {
    const symbol = reel.symbols[j];
    symbol.y = ((reel.position + j) % reel.symbols.length) * symbol_width - symbol_width;
    }

    reelsComplete();
  }

  
  // Reels done handler.
  function reelsComplete()
  {
      gameRunning = false;
      checkWin();
  }
  const paylines = [
    [1 ,1, 1, 1, 1], // top row
    [2, 2, 2, 2, 2], // middle row
    [1, 2, 3, 2, 1], // V shape
    [2, 1, 2, 1, 2], // reverse W shape
    [3, 3, 3, 3, 3], // bottom row
  ];
  const paylineButtons: Sprite[] = [];
  let paylineContainer: Container | null = null;
  const buttonSpacing = 10;
  const buttonSize = 30; // Size of each button

  for (let i = 0; i < paylines.length; i++) {
    const rightButton = new Sprite(buttonTextures[i]);
    const leftButton = new Sprite(buttonTextures[i]);
    //button.tint = 0xFFD700; // Gold color for buttons
    rightButton.width = buttonSize * 2; // Double the width for better touch area
    rightButton.height = buttonSize * 2; // Double the height for better touch area
    rightButton.x = reelsContainer.x - buttonSize - buttonSpacing * 3; // Position on the left side
    rightButton.y = margin*1.25 + i * (buttonSize + buttonSpacing * 8); // Vertical spacing
    rightButton.eventMode = 'static';
    rightButton.cursor = 'pointer';

    leftButton.width = rightButton.width;
    leftButton.height = rightButton.height;
    leftButton.x = reelsContainer.x + reel_width * reel_count; // Position on the right side
    leftButton.y = rightButton.y; // Align with the right button
    leftButton.eventMode = 'static';
    leftButton.cursor = 'pointer';


    // Add hover effect
    rightButton.addListener('pointerover', () => {
      highlightPaylines(i);
    });
    leftButton.addListener('pointerover', () => {
      highlightPaylines(i);
    });

    rightButton.addListener('pointerout', () => {
      clearPaylineHighlight();
    });
    leftButton.addListener('pointerout', () => {
      clearPaylineHighlight();
    });

    app.stage.addChild(rightButton);
    app.stage.addChild(leftButton);
    paylineButtons.push(rightButton);
    paylineButtons.push(leftButton);
  }
  
  let paylineGraphics: Graphics | null = null; // Store payline graphics object
  let winningSymbols: Sprite[] = [];
  let glowTime = 0;
  function checkWin()
  {
    const winningPaylines = [];
    const winningSymbols = [];

    for (let p = 0; p < paylines.length; p++) {
      const payline = paylines[p];
      const firstSymbol = reels[0].symbols[payline[0]].texture;
      let isWinning = true;

      for (let i = 1; i < reels.length; i++) {
        if (reels[i].symbols[payline[i]].texture !== firstSymbol) {
          isWinning = false;
          break;
        }
      }

      if (isWinning) {
        winningPaylines.push(p);
        
        for (let i = 0; i < reels.length; i++) {
          winningSymbols.push(reels[i].symbols[payline[i]]);
        }
      }
    }

    if (winningPaylines.length > 0) {
      animateWinningSymbols(winningSymbols);
      //highlightPaylines(winningPaylines);
      //console.log('Winning paylines:', winningPaylines);
    }
  }
  function clearPaylineHighlight() {
    // Remove existing payline graphics if they exist
    if (paylineContainer) {
      app.stage.removeChild(paylineContainer);
      paylineContainer.destroy({ children: true });
    }
  }

  function clearWins() {
    // Reset tint for all symbols
    for (let i = 0; i < reels.length; i++) {
      const reel = reels[i];
      for (let j = 0; j < reel.symbols.length; j++) {
        reel.symbols[j].tint = 0xFFFFFF; // Reset tint to white (no highlight)
      }
    }
  
    // Remove payline graphics if they exist
    if (paylineGraphics) {
      app.stage.removeChild(paylineGraphics);
      paylineGraphics = null;
    }
    // Clear winning symbols
    winningSymbols = [];
  }
  function highlightPaylines(paylineIndex: number)
  {
    if (paylineContainer) {
      app.stage.removeChild(paylineContainer);
      paylineContainer.destroy({children: true});
    }
    paylineContainer = new Container();
    app.stage.addChildAt(paylineContainer, 0);

    const payline = paylines[paylineIndex];
    const paylineGraphics = new Graphics();
    for (let i = 0; i < reels.length - 1; i++) {
      const symbol = reels[i].symbols[payline[i] ];
      const x = reelsContainer.x + reels[i].container.x + symbol.x + symbol.width / 2 ;
      const y = reelsContainer.y +reels[i].container.y + symbol.y + symbol.height / 2 ;

      const nextSymbol = reels[i + 1].symbols[payline[i + 1] ];
      const nextX = reelsContainer.x + reels[i + 1].container.x + nextSymbol.x + nextSymbol.width / 2;
      const nextY = reelsContainer.y +reels[i + 1].container.y + nextSymbol.y + nextSymbol.height /2;


      paylineGraphics.moveTo(x, y);
      paylineGraphics.lineTo(nextX, nextY);

      paylineGraphics.stroke({width: 20,  color: 0xFFD700});
      paylineContainer.addChild(paylineGraphics);
      
    };

    //app.stage.addChild(paylineContainer);
  }
  function animateWinningSymbols(symbols : Sprite[]) {
    symbols.forEach(symbol => {
        const glow = new GlowFilter({ distance: 15, outerStrength: 2, innerStrength: 1, color: 0xFFD700 });
        app.ticker.add(() => {
          glowTime += 0.01; // Increment time for the sine wave
            const glowIntensity = Math.sin(glowTime) * 0.5 + 0.5; // Sine wave between 0 and 1
            symbol.alpha = glowIntensity;
        });
    });
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

    //reelsComplete();

})();
