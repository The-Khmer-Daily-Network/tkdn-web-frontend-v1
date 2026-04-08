interface PageHeaderProps {
  title: string;
}

export default function PageHeader({ title }: PageHeaderProps) {
  return (
    <div className="sticky top-0 z-10 w-full h-[45px] bg-[#273C8F] flex items-center justify-start px-10">
      <h6 className="text-white text-ls font-semibold">{title}</h6>
    </div>
  );
}
