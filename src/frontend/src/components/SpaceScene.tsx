import { memo } from 'react';
import BlinkingStars from './BlinkingStars';

const SpaceScene = memo(() => {
    return (
        <>
            {/* Black space background */}
            <color attach="background" args={['#000000']} />
            
            {/* Softly blinking stars for realism */}
            <BlinkingStars />
        </>
    );
});

SpaceScene.displayName = 'SpaceScene';

export default SpaceScene;
