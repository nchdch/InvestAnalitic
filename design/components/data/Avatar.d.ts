/**
 * Avatar / broker tile. With `src` it shows an image; otherwise colour-coded
 * initials derived deterministically from `name`. Used as the неутральная
 * broker-account tile (Сбер → "С") since third-party broker logos aren't bundled,
 * and for the user/AI identity. Tile colours avoid P&L hues.
 */
export interface AvatarProps {
  /** Source name — drives initials and the deterministic colour. */
  name?: string
  /** Optional image URL (licensed broker logo / user photo). */
  src?: string | null
  /** @default "square" (broker) — use "circle" for people. */
  shape?: 'square' | 'circle'
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg'
  /** Force a specific background colour/token. */
  color?: string
  className?: string
}

export declare function Avatar(props: AvatarProps): JSX.Element
