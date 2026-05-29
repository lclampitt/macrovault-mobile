import { Children, type ReactNode } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';
import { Motion } from '../../lib/design-system';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  /** Override the per-child delay step (default 60ms). */
  step?: number;
  /** Initial delay before the first child appears. */
  baseDelay?: number;
};

/**
 * Page-entrance stagger wrapper. Each direct child fades in + rises 8px
 * over 500ms with cubic-bezier(0.16, 1, 0.3, 1) easing, 60ms increments
 * between children. Matches the spec's `.stagger` rule on web.
 *
 * Children that should NOT participate (e.g. position:absolute overlays)
 * should be siblings of this wrapper, not inside it.
 */
export default function StaggerView({
  children,
  style,
  step = Motion.staggerStep,
  baseDelay = 40,
}: Props) {
  const items = Children.toArray(children);
  return (
    <>
      {items.map((child, i) => (
        <Animated.View
          key={i}
          entering={FadeInDown.duration(Motion.durationRise)
            .delay(baseDelay + i * step)
            .springify()
            .damping(20)}
          style={style}
        >
          {child}
        </Animated.View>
      ))}
    </>
  );
}
