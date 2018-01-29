 # Node Server

 My own Personal Raspberry Pi server, which performs several functions;

 * Acts as an Interface to my Phillips Hue Lights

 * Controls Data logging for various sensors:

     - Room Temperature

     - External Temperature (soon)

     - Rain Sensor (soon)

     - Proximity Sensor (soon)

 * Raspberry Pi Camera Control, and photo logging

 * Raspberry Pi Fan Control

 ## Getting Started

 These instructions will get you a copy of the project up and running on your local machine.

 Install Node.js, for more info; [nodejs.org](https://nodejs.org/en/)

 ### Prerequisites

 There are several packages needed to run in it's current state.

 ```
 express
 socket.io
 nodemailer
 ds18x20
 raspicam
 onoff
 ```

 ### Installing

 To install these packages, navigate to the folder containing hueServer.js and install using npm

 ```
 npm install <package> --save
 ```


 ## Running the server


 Many of the features available on this page do not function without additional hardware, but this should not cause any issues.
 I will eventually look into having a package manager to enable/disable these features.



 ## Built With

 * [Node.js](nodejs.org/en/) - The web framework used


 ## Authors

 * **Jack Gooding** - [Github](https://github.com/ironcladjack)

 See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.
