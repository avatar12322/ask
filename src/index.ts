import './styles.scss';
import Processor from './inc/Simple8086Simulator';


async function startStuff() {
    const processorEmulator = new Processor();

    processorEmulator.start();
}

startStuff().then(() => {
    console.log('All done!');
});