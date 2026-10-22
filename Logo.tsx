import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

export default function ChefChristoffelLogo({
  size = 52,
}: {
  size?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      accessibilityLabel="Chef Christoffel's restaurant logo"
    >
      <Circle cx="50" cy="50" r="47" fill="#244B38" />
      <Circle
        cx="50"
        cy="50"
        r="43"
        fill="none"
        stroke="#C89A5B"
        strokeWidth="1.5"
      />
      <Path
        d="M26 44c-5.6-2.2-8.4-7.2-7-12.4 1.3-4.8 6.4-7.8 11.3-6.1 1.7-8.5 9.3-14.2 18.3-13.5 7.5.6 13.6 6.2 14.8 13.7 5.8-1.2 11.8 2 13.2 7.5 1.2 4.6-1.3 8.9-5.8 10.8v5H26v-5Z"
        fill="#FBF7EC"
      />
      <Path d="M25 49h51v7H25z" fill="#C89A5B" />
      <SvgText
        x="50"
        y="78"
        fill="#FBF7EC"
        fontSize="17"
        fontWeight="700"
        letterSpacing="2"
        textAnchor="middle"
      >
        CC
      </SvgText>
    </Svg>
  );
}
