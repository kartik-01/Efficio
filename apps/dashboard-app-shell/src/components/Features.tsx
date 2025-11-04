import { Check } from "lucide-react";

const features = [
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.12971 1.79064C7.59377 2.20783 7.63127 2.91564 7.21409 3.3797L3.83909 7.1297C3.63284 7.35939 3.34221 7.49533 3.03284 7.50002C2.72346 7.5047 2.42815 7.38752 2.20784 7.17189L0.328149 5.29689C-0.107788 4.85627 -0.107788 4.14377 0.328149 3.70314C0.764087 3.26252 1.48127 3.26252 1.91721 3.70314L2.95315 4.73908L5.53596 1.87033C5.95315 1.40627 6.66096 1.36877 7.12502 1.78595L7.12971 1.79064ZM7.12971 9.29064C7.59377 9.70783 7.63127 10.4156 7.21409 10.8797L3.83909 14.6297C3.63284 14.8594 3.34221 14.9953 3.03284 15C2.72346 15.0047 2.42815 14.8875 2.20784 14.6719L0.328149 12.7969C-0.112476 12.3563 -0.112476 11.6438 0.328149 11.2078C0.768774 10.7719 1.48127 10.7672 1.91721 11.2078L2.95315 12.2438L5.53596 9.37502C5.95315 8.91095 6.66096 8.87345 7.12502 9.29064H7.12971ZM10.5 4.50002C10.5 3.67033 11.1703 3.00002 12 3.00002H22.5C23.3297 3.00002 24 3.67033 24 4.50002C24 5.3297 23.3297 6.00002 22.5 6.00002H12C11.1703 6.00002 10.5 5.3297 10.5 4.50002ZM10.5 12C10.5 11.1703 11.1703 10.5 12 10.5H22.5C23.3297 10.5 24 11.1703 24 12C24 12.8297 23.3297 13.5 22.5 13.5H12C11.1703 13.5 10.5 12.8297 10.5 12ZM7.50002 19.5C7.50002 18.6703 8.17034 18 9.00002 18H22.5C23.3297 18 24 18.6703 24 19.5C24 20.3297 23.3297 21 22.5 21H9.00002C8.17034 21 7.50002 20.3297 7.50002 19.5ZM2.25002 17.25C2.84676 17.25 3.41906 17.4871 3.84101 17.909C4.26297 18.331 4.50002 18.9033 4.50002 19.5C4.50002 20.0968 4.26297 20.669 3.84101 21.091C3.41906 21.513 2.84676 21.75 2.25002 21.75C1.65329 21.75 1.08099 21.513 0.659034 21.091C0.237077 20.669 2.44007e-05 20.0968 2.44007e-05 19.5C2.44007e-05 18.9033 0.237077 18.331 0.659034 17.909C1.08099 17.4871 1.65329 17.25 2.25002 17.25Z"
          fill="white"
        />
      </svg>
    ),
    title: "Task Manager",
    description:
      "Organize, prioritize, and track your tasks with intuitive drag-and-drop functionality and smart categorization.",
    gradient: "from-blue-50 to-indigo-50",
    iconBg: "bg-indigo-500",
    checkColor: "text-indigo-500",
    items: [
      "Kanban boards & list views",
      "Priority management",
      "Due date tracking",
    ],
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 0C15.1826 0 18.2348 1.26428 20.4853 3.51472C22.7357 5.76516 24 8.8174 24 12C24 15.1826 22.7357 18.2348 20.4853 20.4853C18.2348 22.7357 15.1826 24 12 24C8.8174 24 5.76516 22.7357 3.51472 20.4853C1.26428 18.2348 0 15.1826 0 12C0 8.8174 1.26428 5.76516 3.51472 3.51472C5.76516 1.26428 8.8174 0 12 0ZM10.875 5.625V12C10.875 12.375 11.0625 12.7266 11.3766 12.9375L15.8766 15.9375C16.3922 16.2844 17.0906 16.1437 17.4375 15.6234C17.7844 15.1031 17.6437 14.4094 17.1234 14.0625L13.125 11.4V5.625C13.125 5.00156 12.6234 4.5 12 4.5C11.3766 4.5 10.875 5.00156 10.875 5.625Z"
          fill="white"
        />
      </svg>
    ),
    title: "Time Tracker",
    description:
      "Monitor time spent on tasks with precise tracking, automatic categorization, and detailed time logs.",
    gradient: "from-emerald-50 to-green-50",
    iconBg: "bg-emerald-500",
    checkColor: "text-emerald-500",
    items: [
      "Automatic time tracking",
      "Project categorization",
      "Break reminders",
    ],
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1.5 1.5C2.32969 1.5 3 2.17031 3 3V18.75C3 19.1625 3.3375 19.5 3.75 19.5H22.5C23.3297 19.5 24 20.1703 24 21C24 21.8297 23.3297 22.5 22.5 22.5H3.75C1.67812 22.5 0 20.8219 0 18.75V3C0 2.17031 0.670312 1.5 1.5 1.5ZM6 6C6 5.17031 6.67031 4.5 7.5 4.5H16.5C17.3297 4.5 18 5.17031 18 6C18 6.82969 17.3297 7.5 16.5 7.5H7.5C6.67031 7.5 6 6.82969 6 6ZM7.5 9H13.5C14.3297 9 15 9.67031 15 10.5C15 11.3297 14.3297 12 13.5 12H7.5C6.67031 12 6 11.3297 6 10.5C6 9.67031 6.67031 9 7.5 9ZM7.5 13.5H19.5C20.3297 13.5 21 14.1703 21 15C21 15.8297 20.3297 16.5 19.5 16.5H7.5C6.67031 16.5 6 15.8297 6 15C6 14.1703 6.67031 13.5 7.5 13.5Z"
          fill="white"
        />
      </svg>
    ),
    title: "Analytics",
    description:
      "Gain insights into your productivity patterns with comprehensive reports and visual dashboards.",
    gradient: "from-purple-50 to-pink-50",
    iconBg: "bg-purple-600",
    checkColor: "text-purple-600",
    items: [
      "Productivity insights",
      "Time distribution charts",
      "Goal tracking",
    ],
  },
];

export const Features = () => {
  return (
    <section className="w-full bg-white py-20">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-3 leading-10">
            Everything You Need to Stay Productive
          </h2>
          <p className="text-lg text-gray-600 max-w-[672px] mx-auto leading-7">
            Three powerful modules working together seamlessly to help you accomplish more,
             track your time, and understand your productivity patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`rounded-2xl bg-gradient-to-br ${feature.gradient} p-8 flex flex-col items-center text-center`}
            >
              <div
                className={`w-16 h-16 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-8`}
              >
                {feature.icon}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {feature.title}
              </h3>

              <p className="text-base text-gray-600 mb-8 leading-6">
                {feature.description}
              </p>

              <ul className="space-y-2 w-full">
                {feature.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className="flex items-start gap-2 text-left"
                  >
                    <Check
                      className={`w-3.5 h-3.5 ${feature.checkColor} mt-0.5 flex-shrink-0`}
                    />
                    <span className="text-sm text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

