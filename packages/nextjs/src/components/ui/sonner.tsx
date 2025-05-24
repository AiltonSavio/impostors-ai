import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme={"light"}
      className="toaster group"
      toastOptions={{
        style: {
          background: "#0a1219", // dark pixel bg
          color: "#eae2d1", // off-white text
          border: "1.5px solid #ddb340", // gold border
          boxShadow: "0 6px 24px -4px #101820, 0 1.5px 6px -1.5px #0a1219",
        },
        descriptionClassName: "sonner-desc",
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
