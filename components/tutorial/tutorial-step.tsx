import { Checkbox } from "../ui/checkbox";

export function TutorialStep({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="relative w-full">
      <Checkbox
        id={title}
        name={title}
        className={`absolute top-[3px] mr-2 peer`}
      />
      <label
        htmlFor={title}
        className={`relative text-base text-foreground peer-checked:line-through font-medium block w-full`}
      >
        <span className="ml-8 block break-words">{title}</span>
        <div
          className={`ml-8 text-sm peer-checked:line-through font-normal text-muted-foreground w-full`}
        >
          {children}
        </div>
      </label>
    </li>
  );
}
