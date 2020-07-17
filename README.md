# Foundry VTT Hidden Initiative

"Hidden Initiative" is a [Foundry VTT](https://foundryvtt.com/) module that makes some changes to how initiative is rolled.

The goal of this module is to allow:

-   Defaulting to "GM" visibility for initiative rolls
-   Hiding the visibility of raw initiative values from your players

Vanilla Foundry VTT will roll initiative for monsters (and players) in public, and then show the initiative scores in the Combat Tracker.

If you prefer more suspenseful combat, Hidden Initiative allows you to:

1. Show a placeholder "?" when you first roll monster initiative
2. Leave the final initiative order ambiguous until a full round has completed

You, the DM, will see the exact initiative at all times. Your players will be uncertain of who has the next turn until you press that "Next turn" button, at which point the next monster (or player) will slot into position on their screens.

Once a full round of combat has finished, the initiative order is considered public knowledge and won't re-sort itself any longer.

## Configure roll visibility for players and NPCs

Set your monsters and players with distinct visibility if you like:

![Screenshot of module settings](readme-images/module-settings.png)

When doing group rolls, each roll has the chosen setting applied:

![Screenshot of initiative rolls in chat window](readme-images/chat-rolls.png)

## Keep initiative a mystery until combat is underway

Players can see which monsters haven't rolled yet (...):

![Screenshot of combat tracker with missing rolls](readme-images/pending-rolls.png)

Once a roll is finished, the value changes to "?". As a DM you see the proper list, but all your players know is that the monster is ready for battle:

![Screenshot of combat tracker with some mystery rolls](readme-images/some-rolls.png)

As combat progresses and the turn order is revealed to your players, the initiative values get replaced with a "-" to indicate the monster is locked into its correct position, without giving away the actual roll value:

### DM view
![Screenshot of tracker, mid-combat, from DM perspective](readme-images/mid-combat-dm.png)

### Player view
![Screenshot of tracker, mid-combat](readme-images/mid-combat.png)

Here, the mage is actually next up in the turn order, but Sariph doesn't know that yet.

When the DM presses next turn and announces it's the mage's turn, Sariph will see the mage jump ahead of him in the queue and the "?" will get replaced with a "-" (dependent on module settings).

*Note*: This screenshot is with the "Reveal initiative numbers during combat" setting **unchecked**. If it were checked, the goblin's initiative of 18 would be visible to players after it took its turn.

After that will be Sariph's turn, followed by the final goblin. On subsequent rounds, the combat order will be known for everyone.
